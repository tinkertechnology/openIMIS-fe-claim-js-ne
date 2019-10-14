import React, { Component, Fragment } from "react";
import { injectIntl } from 'react-intl';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
    withModulesManager, withHistory, formatMessageWithValues,
    journalize, historyPush
} from "@openimis/fe-core";
import ClaimForm from "../components/ClaimForm";
import { deliverFeedback } from "../actions";

class FeedbackPage extends Component {

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
            historyPush(this.props.modulesManager, this.props.history, "claim.route.reviews")
        }
    }

    save = (claim) => {
        if (!!claim && !!claim.feedback) {
            this.props.deliverFeedback(
                claim,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    "DeliverClaimFeedback.mutationLabel",
                    { code: claim.code }
                )
            )
        }
    }

    render() {
        const { history, modulesManager, claim_uuid } = this.props;
        return (
            <ClaimForm
                claim_uuid={claim_uuid}
                back={e => historyPush(modulesManager, history, "claim.route.reviews")}
                save={this.save}
                forFeedback={true} />
        )
    }
}

const mapStateToProps = (state, props) => ({
    claim_uuid: props.match.params.claim_uuid,
    submittingMutation: state.claim.submittingMutation,
    mutation: state.claim.mutation,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ deliverFeedback, journalize }, dispatch);
};

export default withHistory(withModulesManager(connect(mapStateToProps, mapDispatchToProps)(
    injectIntl(FeedbackPage)
)));