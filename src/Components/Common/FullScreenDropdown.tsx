import React, { useEffect, useState } from 'react';
import { isFullscreen, onFullscreenChange, toggleFullscreen } from '../../helpers/fullscreen';

const FullScreenDropdown: React.FC = () => {
    /*
    Follows the browser's real full screen state, so the icon is right whether it
    was this button, the Esc key or the "full screen by default" start
    (helpers/fullscreen.ts) that changed it.
    */
    const [active, setActive] = useState<boolean>(isFullscreen);

    useEffect(() => {
        const sync = (on: boolean) => {
            setActive(on);
            document.body.classList.toggle('fullscreen-enable', on);
        };
        sync(isFullscreen());
        const stopListening = onFullscreenChange(sync);
        return () => {
            stopListening();
            document.body.classList.remove('fullscreen-enable');
        };
    }, []);

    return (
        <React.Fragment>
            {/* data-fullscreen-toggle: the "full screen by default" start leaves a press on this button alone */}
            <div className="ms-1 header-item d-none d-sm-flex">
                <button
                    onClick={toggleFullscreen}
                    type="button"
                    data-fullscreen-toggle
                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                >
                    <i className={active ? 'bx bx-exit-fullscreen fs-22' : 'bx bx-fullscreen fs-22'}></i>
                </button>
            </div>
        </React.Fragment>
    );
};

export default FullScreenDropdown;
