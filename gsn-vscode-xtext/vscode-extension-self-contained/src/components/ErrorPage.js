import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './errorPageStyle.css';

ErrorPage.propTypes = {
    message: PropTypes.string,
    refreshModel: PropTypes.func.isRequired,
};
export default function ErrorPage({ message, refreshModel }) {
    useEffect(() => {
        const onEnterDown = (event) => {
            if (event.key === 'Enter' || event.keyCode === 13) {
                refreshModel();
            }
        };

        document.addEventListener('keydown', onEnterDown);
        return () => {
            document.removeEventListener('keydown', onEnterDown);
        }
    }, [refreshModel]);

    return (
        <div className="body-error">
            <div className="notfound">
                <div className="centered">
                    <span className="inverted">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;
                </div>
                <div className="centered">
                    <span className="inverted">&nbsp;E&nbsp;R&nbsp;R&nbsp;</span>
                    <span className="shadow">&nbsp;</span>
                </div>
                <div className="centered">
                    <span className="inverted">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    <span className="shadow">&nbsp;</span>
                </div>
                <div className="centered">
                    &nbsp;<span className="shadow">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </div>
                <div className="row">&nbsp;</div>
                <div className="row">{message}</div>
                <div className="row">&nbsp;</div>
                <div className="row">A fatal exception has occurred at C0DE:ABAD1DEA in 0xC0DEBA5E.</div>
                <div className="row">&nbsp;</div>
                <div className="row">
                    * Click{' '}
                    <button className="inverted" type="button" onClick={refreshModel}>
                        HERE
                    </button>{' '}
                    or press enter to request model again.
                </div>
                <div className="row">* If the same error persists - try to fix any issues in the .gsn files. </div>
                <div className="row">&nbsp;</div>
                <div className="centered">
                    Press ENTER to request model...<span className="blink">&#9608;</span>
                </div>
            </div>
        </div>
    );
}
