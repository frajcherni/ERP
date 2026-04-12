import React from "react";
import { Modal, ModalBody, Button } from "reactstrap";

interface DiscountAlertModalProps {
    show: boolean;
    onConfirmClick: () => void;
    onCloseClick: () => void;
    discountPercentage: number;
}

const DiscountAlertModal: React.FC<DiscountAlertModalProps> = ({
    show,
    onConfirmClick,
    onCloseClick,
    discountPercentage
}) => {
    return (
        <Modal fade={true} isOpen={show} toggle={onCloseClick} centered={true}>
            <ModalBody className="py-4 px-5">
                <div className="text-center">
                    <div className="avatar-xl mx-auto mb-4">
                        <div className="avatar-title bg-danger-subtle text-danger display-3 rounded-circle" style={{ width: '120px', height: '120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>
                            <i className="ri-error-warning-line"></i>
                        </div>
                    </div>
                    <div className="mt-4 pt-2">
                        <h3 className="fw-bold text-danger text-uppercase mb-3" style={{ letterSpacing: '2px' }}>⚠️ ATTENTION ⚠️</h3>
                        <div className="bg-light p-4 rounded-3 border border-danger-subtle mb-4 shadow-sm">
                            <p className="fs-18 mb-2">Remise Exceptionnelle</p>
                            <h1 className="display-4 fw-bold text-danger mb-0">{discountPercentage.toFixed(2)}%</h1>
                        </div>
                        <p className="text-muted fs-16 px-3">
                            Cette remise dépasse le seuil autorisé de <b>10.00%</b>. <br />
                            Voulez-vous vraiment valider cette vente ?
                        </p>
                        <div className="mt-4 pt-2">
                            <Button
                                color="danger"
                                className="btn-lg w-100 py-3 shadow-lg fs-18 fw-bold text-uppercase border-3"
                                onClick={onConfirmClick}
                                style={{ borderRadius: '12px' }}
                            >
                                OUI, VALIDER
                            </Button>
                        </div>
                        <div className="mt-3">
                            <button
                                type="button"
                                className="btn btn-link text-muted fw-semibold"
                                onClick={onCloseClick}
                                style={{ textDecoration: 'none' }}
                            >
                                Annuler et modifier la remise
                            </button>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default DiscountAlertModal;
