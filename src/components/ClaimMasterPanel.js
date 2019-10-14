import React, { Component, Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import { bindActionCreators } from "redux";
import {
    formatMessage, ControlledField,
    PublishedComponent, Contributions, AmountInput, TextInput,
} from "@openimis/fe-core";
import { Grid } from "@material-ui/core";
import _ from "lodash";
import ClaimAdminPicker from "../pickers/ClaimAdminPicker";
import { claimedAmount, approvedAmount } from "../helpers/amounts";
import { claimHealthFacilitySet } from "../actions";
import ClaimStatusPicker from "../pickers/ClaimStatusPicker";
import FeedbackStatusPicker from "../pickers/FeedbackStatusPicker";
import ReviewStatusPicker from "../pickers/ReviewStatusPicker";

const CLAIM_MASTER_PANEL_CONTRIBUTION_KEY = "claim.MasterPanel"

const styles = theme => ({
    paper: theme.paper.paper,
    paperHeader: theme.paper.header,
    paperHeaderAction: theme.paper.action,
    item: theme.paper.item,
});

class ClaimMasterPanel extends Component {

    state = {
        data: {}
    }

    componentDidMount() {
        this.setState({ data: this.props.edited });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if ((prevProps.edited_id && !this.props.edited_id) ||
            prevProps.reset !== this.props.reset
        ) {
            this.setState({ data: this.props.edited });
        } else if (!_.isEqual(prevProps.edited, this.props.edited)) {
            this.setState({ data: this.props.edited })
        }
    }

    updateAttribute = (attr, v) => {
        let data = { ...this.state.data };
        data[attr] = v;
        this.props.onEditedChanged(data);
    }

    render() {
        const { intl, classes, edited, reset, readOnly = false, forReview, forFeedback } = this.props;
        if (!edited) return null;
        let totalClaimed = 0;
        let totalApproved = 0;
        if (edited.items) {
            totalClaimed += edited.items.reduce(
                (sum, r) => sum + claimedAmount(r), 0);
            totalApproved += edited.items.reduce(
                (sum, r) => sum + approvedAmount(r), 0);
        }
        if (edited.services) {
            totalClaimed += edited.services.reduce(
                (sum, r) => sum + claimedAmount(r), 0);
            totalApproved += edited.services.reduce(
                (sum, r) => sum + approvedAmount(r), 0);
        }
        edited.claimed = _.round(totalClaimed, 2);
        edited.approved = _.round(totalApproved, 2);
        let ro = readOnly || !!forReview || !!forFeedback;
        return (
            <Grid container>
                <ControlledField module="claim" id="Claim.healthFacility" field={
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            id="location.HealthFacilityPicker"
                            value={edited.healthFacility}
                            reset={reset}
                            readOnly={true}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="Claim.insuree" field={
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            id="insuree.InsureePicker"
                            value={edited.insuree}
                            reset={reset}
                            onChange={(v, s) => this.updateAttribute("insuree", v, s)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="Claim.claimedDate" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent id="core.DatePicker"
                            value={edited.dateClaimed}
                            module="claim"
                            label="claimedDate"
                            reset={reset}
                            onChange={d => this.updateAttribute("dateClaimed", d)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="Claim.visitDateFrom" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent id="core.DatePicker"
                            value={edited.dateFrom}
                            module="claim"
                            label="visitDateFrom"
                            reset={reset}
                            onChange={d => this.updateAttribute("dateFrom", d)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="Claim.visitDateTo" field={
                    <Grid item xs={2} className={classes.item}>
                        <PublishedComponent id="core.DatePicker"
                            value={edited.dateTo}
                            module="claim"
                            label="visitDateTo"
                            reset={reset}
                            onChange={d => this.updateAttribute("dateTo", d)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="Claim.visitType" field={
                    <Grid item xs={forFeedback || forReview ? 2 : 3} className={classes.item}>
                        <PublishedComponent
                            id="medical.VisitTypePicker"
                            name="visitType"
                            withNull={false}
                            value={edited.visitType}
                            reset={reset}
                            onChange={(v, s) => this.updateAttribute("visitType", v)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                {!forFeedback &&
                    <ControlledField module="claim" id="Claim.mainDiagnosis" field={
                        <Grid item xs={3} className={classes.item}>
                            <PublishedComponent
                                id="medical.DiagnosisPicker"
                                name="mainDiagnosis"
                                label={formatMessage(intl, "claim", "mainDiagnosis")}
                                value={edited.icd}
                                reset={reset}
                                onChange={(v, s) => this.updateAttribute("icd", v)}
                                readOnly={ro}
                            />
                        </Grid>
                    } />
                }
                <ControlledField module="claim" id="Claim.code" field={
                    <Grid item xs={2} className={classes.item}>
                        <TextInput
                            module="claim"
                            label="code"
                            value={edited.code}
                            reset={reset}
                            onChange={v => this.updateAttribute("code", v)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                <ControlledField module="claim" id="Claim.guarantee" field={
                    <Grid item xs={2} className={classes.item}>
                        <TextInput
                            module="claim"
                            label="guaranteeId"
                            value={edited.guaranteeId}
                            reset={reset}
                            onChange={v => this.updateAttribute("guaranteeId", v)}
                            readOnly={ro}
                        />
                    </Grid>
                } />
                {!!forFeedback &&
                    <Fragment>
                        <ControlledField module="claim" id="Claim.status" field={
                            <Grid item xs={2} className={classes.item}>
                                <ClaimStatusPicker
                                    readOnly={true}
                                    value={edited.status}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.feedbackStatus" field={
                            <Grid item xs={2} className={classes.item}>
                                <FeedbackStatusPicker
                                    readOnly={true}
                                    value={edited.feedbackStatus}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.reviewStatus" field={
                            <Grid item xs={2} className={classes.item}>
                                <ReviewStatusPicker
                                    readOnly={true}
                                    value={edited.reviewStatus}
                                />
                            </Grid>
                        } />
                    </Fragment>
                }
                {!forFeedback &&
                    <ControlledField module="claim" id="Claim.claimed" field={
                        <Grid item xs={forReview ? 1 : 2} className={classes.item}>
                            <AmountInput
                                value={edited.claimed}
                                module="claim"
                                label="claimed"
                                readOnly={true}
                            />
                        </Grid>
                    } />
                }
                {forReview &&
                    <Fragment>
                        <ControlledField module="claim" id="Claim.approved" field={
                            <Grid item xs={1} className={classes.item}>
                                <AmountInput
                                    value={edited.approved}
                                    module="claim"
                                    label="approved"
                                    readOnly={true}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.valuated" field={
                            <Grid item xs={1} className={classes.item}>
                                <AmountInput
                                    value={edited.valuated}
                                    module="claim"
                                    label="valuated"
                                    readOnly={true}
                                />
                            </Grid>
                        } />
                    </Fragment>
                }
                {!forFeedback &&
                    <Fragment>
                        <ControlledField module="claim" id="Claim.secDiagnosis1" field={
                            <Grid item xs={3} className={classes.item}>
                                <PublishedComponent
                                    id="medical.DiagnosisPicker"
                                    name="secDiagnosis1"
                                    label={formatMessage(intl, "claim", "secDiagnosis1")}
                                    value={edited.icd1}
                                    reset={reset}
                                    onChange={(v, s) => this.updateAttribute("icd1", v)}
                                    readOnly={ro}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.secDiagnosis2" field={
                            <Grid item xs={3} className={classes.item}>
                                <PublishedComponent
                                    id="medical.DiagnosisPicker"
                                    name="secDiagnosis2"
                                    label={formatMessage(intl, "claim", "secDiagnosis2")}
                                    value={edited.icd2}
                                    reset={reset}
                                    onChange={(v, s) => this.updateAttribute("icd2", v)}
                                    readOnly={ro}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.secDiagnosis3" field={
                            <Grid item xs={3} className={classes.item}>
                                <PublishedComponent
                                    id="medical.DiagnosisPicker"
                                    name="secDiagnosis3"
                                    label={formatMessage(intl, "claim", "secDiagnosis3")}
                                    value={edited.icd3}
                                    reset={reset}
                                    onChange={(v, s) => this.updateAttribute("icd3", v)}
                                    readOnly={ro}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.secDiagnosis4" field={
                            <Grid item xs={3} className={classes.item}>
                                <PublishedComponent
                                    id="medical.DiagnosisPicker"
                                    name="secDiagnosis4"
                                    label={formatMessage(intl, "claim", "secDiagnosis4")}
                                    value={edited.icd4}
                                    reset={reset}
                                    onChange={(v, s) => this.updateAttribute("icd4", v)}
                                    readOnly={ro}
                                />
                            </Grid>
                        } />
                    </Fragment>
                }
                <ControlledField module="claim" id="Claim.admin" field={
                    <Grid item xs={4} className={classes.item}>
                        <ClaimAdminPicker
                            value={edited.admin}
                            onChange={(v, s) => this.updateAttribute("admin", v)}
                            readOnly={true}
                        />
                    </Grid>
                } />
                {!forFeedback &&
                    <Fragment>
                        <ControlledField module="claim" id="Claim.explanation" field={
                            <Grid item xs={4} className={classes.item}>
                                <TextInput
                                    module="claim"
                                    label="explanation"
                                    value={edited.explanation}
                                    reset={reset}
                                    onChange={v => this.updateAttribute("explanation", v)}
                                    readOnly={ro}
                                />
                            </Grid>
                        } />
                        <ControlledField module="claim" id="Claim.adjustment" field={
                            <Grid item xs={4} className={classes.item}>
                                <TextInput
                                    module="claim"
                                    label="adjustment"
                                    value={edited.adjustment}
                                    reset={reset}
                                    onChange={v => this.updateAttribute("adjustment", v)}
                                    readOnly={!!forFeedback || ro}
                                />
                            </Grid>
                        } />
                    </Fragment>
                }
                <Contributions contributionKey={CLAIM_MASTER_PANEL_CONTRIBUTION_KEY} />
            </Grid>
        )
    }
}

const mapStateToProps = (state, props) => ({
    userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
})

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ claimHealthFacilitySet }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(ClaimMasterPanel))))