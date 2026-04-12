// components/EditClientModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  Row,
  Col,
  FormFeedback,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { updateClient } from "../../../Components/Article/ArticleServices";
import { toast } from "react-toastify";
import {
  Client,
} from "../../../Components/Article/Interfaces";
interface EditClientModalProps {
  isOpen: boolean;
  toggle: () => void;
  client: Client | null;
  onClientUpdated: (updatedClient: Client) => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  toggle,
  client,
  onClientUpdated,
}) => {
  const [loading, setLoading] = useState(false);

  // Phone formatting function
  const formatPhoneInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "").slice(0, 8);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)}`;
  };

  const validationSchema = Yup.object().shape({
    raison_sociale: Yup.string().required("La raison sociale est requise"),
    designation: Yup.string(),
    telephone1: Yup.string(),
    telephone2: Yup.string(),
    email: Yup.string().email("Email invalide"),
    adresse: Yup.string(),
    ville: Yup.string(),
    code_postal: Yup.string(),
    matricule_fiscal: Yup.string(),
    register_commerce: Yup.string(),
    status: Yup.string().oneOf(["Actif", "Inactif"]).required("Le statut est requis"),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      raison_sociale: client?.raison_sociale || "",
      designation: client?.designation || "",
      telephone1: client?.telephone1 || "",
      telephone2: client?.telephone2 || "",
      email: client?.email || "",
      adresse: client?.adresse || "",
      ville: client?.ville || "",
      code_postal: client?.code_postal || "",
      matricule_fiscal: client?.matricule_fiscal || "",
      register_commerce: client?.register_commerce || "",
      status: (client?.status as "Actif" | "Inactif") || "Actif",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!client) return;
      
      setLoading(true);
      try {
        // Format phone numbers before sending
        const formattedValues = {
          ...values,
          telephone1: values.telephone1.replace(/\s/g, ""),
          telephone2: values.telephone2.replace(/\s/g, ""),
        };

        const updatedClient = await updateClient(client.id, formattedValues);
        
        toast.success("Client mis à jour avec succès");
        onClientUpdated(updatedClient);
        toggle();
      } catch (error) {
        toast.error("Erreur lors de la mise à jour du client");
        console.error("Update client error:", error);
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle phone input formatting
  const handlePhoneChange = (field: "telephone1" | "telephone2", value: string) => {
    const formatted = formatPhoneInput(value);
    formik.setFieldValue(field, formatted);
  };

  if (!client) return null;

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
      <ModalHeader toggle={toggle}>
        <div className="d-flex align-items-center">
          <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
            <i className="ri-edit-line text-primary fs-4"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold text-dark">Modifier Client</h4>
            <small className="text-muted">{client.telephone1|| client.raison_sociale}</small>
          </div>
        </div>
      </ModalHeader>
      
      <form onSubmit={formik.handleSubmit}>
        <ModalBody>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Raison Sociale *</Label>
                <Input
                  name="raison_sociale"
                  value={formik.values.raison_sociale}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  invalid={formik.touched.raison_sociale && !!formik.errors.raison_sociale}
                  className="form-control-lg"
                  placeholder="Raison sociale"
                />
                <FormFeedback>{formik.errors.raison_sociale}</FormFeedback>
              </div>
            </Col>
            
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Désignation</Label>
                <Input
                  name="designation"
                  value={formik.values.designation}
                  onChange={formik.handleChange}
                  className="form-control-lg"
                  placeholder="Désignation"
                />
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Téléphone 1</Label>
                <Input
                  name="telephone1"
                  value={formik.values.telephone1}
                  onChange={(e) => handlePhoneChange("telephone1", e.target.value)}
                  className="form-control-lg"
                  placeholder="22 222 222"
                />
              </div>
            </Col>
            
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Téléphone 2</Label>
                <Input
                  name="telephone2"
                  value={formik.values.telephone2}
                  onChange={(e) => handlePhoneChange("telephone2", e.target.value)}
                  className="form-control-lg"
                  placeholder="22 222 222"
                />
              </div>
            </Col>
          </Row>

          <div className="mb-3">
            <Label className="form-label fw-semibold">Email</Label>
            <Input
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.email && !!formik.errors.email}
              className="form-control-lg"
              placeholder="email@exemple.com"
            />
            <FormFeedback>{formik.errors.email}</FormFeedback>
          </div>

          <div className="mb-3">
            <Label className="form-label fw-semibold">Adresse</Label>
            <Input
              name="adresse"
              value={formik.values.adresse}
              onChange={formik.handleChange}
              className="form-control-lg"
              placeholder="Adresse complète"
            />
          </div>

          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Ville</Label>
                <Input
                  name="ville"
                  value={formik.values.ville}
                  onChange={formik.handleChange}
                  className="form-control-lg"
                  placeholder="Ville"
                />
              </div>
            </Col>
            
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Code Postal</Label>
                <Input
                  name="code_postal"
                  value={formik.values.code_postal}
                  onChange={formik.handleChange}
                  className="form-control-lg"
                  placeholder="Code postal"
                />
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Matricule Fiscal</Label>
                <Input
                  name="matricule_fiscal"
                  value={formik.values.matricule_fiscal}
                  onChange={formik.handleChange}
                  className="form-control-lg"
                  placeholder="Matricule fiscal"
                />
              </div>
            </Col>
            
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label fw-semibold">Registre Commerce</Label>
                <Input
                  name="register_commerce"
                  value={formik.values.register_commerce}
                  onChange={formik.handleChange}
                  className="form-control-lg"
                  placeholder="Registre de commerce"
                />
              </div>
            </Col>
          </Row>

          <div className="mb-3">
            <Label className="form-label fw-semibold">Statut</Label>
            <Input
              type="select"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              className="form-control-lg"
            >
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </Input>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="light" onClick={toggle} disabled={loading}>
            <i className="ri-close-line me-2"></i>
            Annuler
          </Button>
          <Button color="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <i className="ri-loader-4-line me-2 spin"></i>
                Mise à jour...
              </>
            ) : (
              <>
                <i className="ri-save-line me-2"></i>
                Enregistrer
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditClientModal;