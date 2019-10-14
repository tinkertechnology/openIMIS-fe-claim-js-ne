import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import { Fab, Tooltip } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import _ from "lodash";
import AddIcon from "@material-ui/icons/Add";
import {
    withHistory, historyPush, withModulesManager,
    formatMessage, formatMessageWithValues,
    journalize, coreConfirm
} from "@openimis/fe-core";
import ClaimSearcher from "../components/ClaimSearcher";

import { selectForFeedback, selectForReview, submit, del, selectHealthFacility } from "../actions";
import { RIGHT_ADD, RIGHT_LOAD, RIGHT_PRINT, RIGHT_SUBMIT, RIGHT_DELETE } from "../constants";

const styles = theme => ({
    fab: theme.fab
});

class HealthFacilitiesPage extends Component {

    constructor(props) {
        super(props);
        let defaultFilters = props.modulesManager.getConf(
            "fe-claim",
            "healthFacilities.defaultFilters",
            {
                "claimStatus": {
                    "value": 2,
                    "filter": "status: 2"
                }
            }
        )

        this.state = {
            defaultFilters,
            confirmedAction: null,
        }
    }

    _filterOnUserHealthFacilityFullPath() {
        let defaultFilters = { ...this.state.defaultFilters }
        defaultFilters.healthFacility = {
            "value": this.props.userHealthFacilityFullPath,
            "filter": `healthFacility_Id: "${this.props.userHealthFacilityFullPath.id}"`
        }
        let district = this.props.userHealthFacilityFullPath.location;
        defaultFilters.district = {
            "value": district,
            "filter": `healthFacility_Location_Id: "${district.id}"`
        }
        let region = district.parent;
        defaultFilters.region = {
            "value": region,
            "filter": `healthFacility_Location_Parent_Id: "${region.id}"`
        }
        this.setState({ defaultFilters })
        this.props.selectHealthFacility(this.props.userHealthFacilityFullPath);
    }

    componentDidMount() {
        if (!!this.props.userHealthFacilityFullPath) {
            this._filterOnUserHealthFacilityFullPath();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
        }
        if (!_.isEqual(prevProps.userHealthFacilityFullPath, this.props.userHealthFacilityFullPath)) {
            this._filterOnUserHealthFacilityFullPath();
        }
        if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
            this.state.confirmedAction();
        }
    }

    canSubmitSelected = (selection) => !!selection && selection.length && selection.filter(s => s.status === 2).length === selection.length

    submitSelected = (selection) => {
        if (selection.length === 1) {
            this.props.submit(
                selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    "SubmitClaim.mutationLabel",
                    { code: selection[0].code }
                )
            );
        } else {
            this.props.submit(
                selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    "SubmitClaims.mutationLabel",
                    { count: selection.length }
                )
            );
        }
    }

    canDeleteSelected = (selection) => !!selection && selection.length && selection.filter(s => s.status === 2).length === selection.length

    deleteSelected = (selection) => {
        let confirm = null;
        let confirmedAction = null;
        if (selection.length === 1) {
            confirmedAction = () => this.props.del(
                selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    "DeleteClaim.mutationLabel",
                    { code: selection[0].code }
                )
            );
            confirm = e => this.props.coreConfirm(
                formatMessage(this.props.intl, "claim", "deleteClaim.confirm.title"),
                formatMessageWithValues(this.props.intl, "claim", "deleteClaim.confirm.message",
                    {
                        code: selection[0].code,
                    }),
            );
        } else {
            confirmedAction = () => this.props.del(
                selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    "DeleteClaims.mutationLabel",
                    { count: selection.length }
                )
            );
            confirm = e => this.props.coreConfirm(
                formatMessage(this.props.intl, "claim", "deleteClaims.confirm.title"),
                formatMessageWithValues(this.props.intl, "claim", "deleteClaims.confirm.message",
                    {
                        count: selection.length,
                    }),
            );
        }

        this.setState(
            { confirmedAction },
            confirm
        )
    }

    onDoubleClick = (c) => {
        historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit", [c.uuid])
    }

    onAdd = () => {
        historyPush(this.props.modulesManager, this.props.history, "claim.route.claimEdit");
    }

    canAdd = () => {
        if (!this.props.claimAdmin) return false
        if (!this.props.claimHealthFacility) return false
        return true;
    }

    render() {
        const { intl, classes, rights, generatingPrint } = this.props;
        if (!rights.filter(r => r >= RIGHT_ADD && r <= RIGHT_SUBMIT).length) return null;
        let actions = [];
        if (rights.includes(RIGHT_SUBMIT)) {
            actions.push({ label: "claimSummaries.submitSelected", enabled: this.canSubmitSelected, action: this.submitSelected });
        }
        if (rights.includes(RIGHT_DELETE)) {
            actions.push({ label: "claimSummaries.deleteSelected", enabled: this.canDeleteSelected, action: this.deleteSelected });
        }
        return (
            <Fragment>
                <ClaimSearcher
                    defaultFilters={this.state.defaultFilters}
                    onDoubleClick={rights.includes(RIGHT_LOAD) ? this.onDoubleClick : null}
                    actions={actions}
                    processing={generatingPrint}
                />
                {!generatingPrint && rights.includes(RIGHT_ADD) &&
                    <Tooltip title={!this.canAdd() ? formatMessage(intl, "claim", "newClaim.adminAndHFRequired") : ""}>
                        <div className={classes.fab}>
                            <Fab color="primary" disabled={!this.canAdd()} onClick={this.onAdd}>
                                <AddIcon />
                            </Fab>
                        </div>
                    </Tooltip>
                }
            </Fragment>
        );
    }
}

const mapStateToProps = state => ({
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
    confirmed: state.core.confirmed,
    userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
    userHealthFacilityStr: state.loc ? state.loc.userHealthFacilityStr : null,
    userRegionStr: !!state.loc ? state.loc.userRegionStr : null,
    userDistrictStr: !!state.loc ? state.loc.userDistrictStr : null,
    submittingMutation: state.claim.submittingMutation,
    mutation: state.claim.mutation,
    claimAdmin: state.claim.claimAdmin,
    claimHealthFacility: state.claim.claimHealthFacility,
});


const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            coreConfirm,
            selectForFeedback,
            selectForReview,
            submit,
            del,
            journalize,
            selectHealthFacility,
        },
        dispatch);
};

export default injectIntl(withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(
    withTheme(withStyles(styles)(HealthFacilitiesPage))
))));