import React, { useEffect, useRef, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Badge } from "reactstrap";
import { Article } from "../../../Components/Article/Interfaces";

interface QuantiteArticleModalProps {
  /** The article picked in the search; the modal is open while it is set */
  article: Article | null;
  /** Quantity already on the bon for this article, if any (the new one is added to it) */
  existingQuantity?: number;
  onConfirm: (quantite: number) => void;
  onCancel: () => void;
}

/** Asks the quantity of an article before adding it to the bon. Starts empty, not 0. */
const QuantiteArticleModal: React.FC<QuantiteArticleModalProps> = ({
  article,
  existingQuantity,
  onConfirm,
  onCancel,
}) => {
  const [quantite, setQuantite] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (article) setQuantite("");
  }, [article]);

  const parsed = parseInt(quantite, 10);
  const isValid = !isNaN(parsed) && parsed > 0;

  const confirm = () => {
    if (isValid) onConfirm(parsed);
  };

  return (
    <Modal
      isOpen={!!article}
      toggle={onCancel}
      centered
      size="sm"
      onOpened={() => inputRef.current?.focus()}
    >
      <ModalHeader toggle={onCancel}>Quantité</ModalHeader>
      <ModalBody>
        {article && (
          <div className="mb-3">
            <strong className="text-primary d-block">{article.reference}</strong>
            <small className="text-muted d-block">{article.designation}</small>
            <div className="mt-1">
              <Badge color="light" className="text-dark me-1">Stock: {article.qte || 0}</Badge>
              <Badge color="success">HT: {(Number(article.pua_ht) || 0).toFixed(3)} DT</Badge>
            </div>
            {!!existingQuantity && (
              <small className="text-info d-block mt-2">
                <i className="ri-information-line me-1"></i>
                Déjà {existingQuantity} sur le bon : la quantité saisie sera ajoutée.
              </small>
            )}
          </div>
        )}
        <Label className="form-label fw-semibold">Quantité*</Label>
        <Input
          innerRef={inputRef}
          type="number"
          min="1"
          step="1"
          value={quantite}
          placeholder="Saisir la quantité"
          onChange={(e) => setQuantite(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirm();
            }
          }}
          className="form-control-lg"
        />
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onCancel}>
          Annuler
        </Button>
        <Button color="primary" onClick={confirm} disabled={!isValid}>
          <i className="ri-add-line me-1"></i> Ajouter
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default QuantiteArticleModal;
