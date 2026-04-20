import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Row, Col } from 'reactstrap';
import { updateArticle } from '../../../Components/Article/ArticleServices';
import { toast } from 'react-toastify';

interface EditArticleModalProps {
  isOpen: boolean;
  toggle: () => void;
  onSuccess: (article: any) => void;
  fournisseurs: any[];
  categories: any[];
  article: any;
}

const EditArticleModal: React.FC<EditArticleModalProps> = ({ 
  isOpen, 
  toggle, 
  onSuccess, 
  fournisseurs, 
  categories,
  article 
}) => {
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    qte: 0,
    pua_ht: 0,
    pua_ttc: 0,
    puv_ht: 0,
    puv_ttc: 0,
    tva: 0,
    taux_fodec: false,
    type: 'Non Consigné',
    fournisseur_id: '',
    categorie_id: '',
    sous_categorie_id: '',
    remise: 0
  });

  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (article && isOpen) {
      setFormData({
        reference: article.reference || '',
        designation: article.designation || article.nom || '',
        qte: article.qte || 0,
        pua_ht: article.pua_ht || article.prixUnitaire || 0,
        pua_ttc: article.pua_ttc || article.prixTTC || 0,
        puv_ht: article.puv_ht || 0,
        puv_ttc: article.puv_ttc || 0,
        tva: article.tva || 0,
        taux_fodec: article.taux_fodec || false,
        type: article.type || 'Non Consigné',
        fournisseur_id: article.fournisseur_id || article.fournisseur?.id || '',
        categorie_id: article.categorie_id || article.categorie?.id || '',
        sous_categorie_id: article.sous_categorie_id || article.sous_categorie?.id || '',
        remise: article.remise || 0
      });

      if (article.categorie_id || (article.categorie && article.categorie.id)) {
        const catId = article.categorie_id || article.categorie.id;
        const filtered = categories.filter(c => c.parent_id === parseInt(catId));
        setSubCategories(filtered);
      }
    }
  }, [article, isOpen, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox for taux_fodec
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: ['qte', 'pua_ht', 'tva', 'pua_ttc', 'puv_ht', 'puv_ttc', 'remise'].includes(name) 
          ? Number(value) 
          : value
      };

      if (name === 'categorie_id') {
        const filtered = categories.filter(c => c.parent_id === parseInt(value));
        setSubCategories(filtered);
        updated.sous_categorie_id = '';
      }

      // Auto-calculate TTC when HT or TVA changes
      const tvaRate = updated.tva / 100;
      const fodecMultiplier = updated.taux_fodec ? 1.01 : 1;

      if (name === 'pua_ht' || name === 'tva' || name === 'taux_fodec') {
        updated.pua_ttc = parseFloat((updated.pua_ht * fodecMultiplier * (1 + tvaRate)).toFixed(3));
      }
      if (name === 'puv_ht' || name === 'tva' || name === 'taux_fodec') {
        updated.puv_ttc = parseFloat((updated.puv_ht * fodecMultiplier * (1 + tvaRate)).toFixed(3));
      }
      
      // Calculate reverse if TTC is changed directly
      if (name === 'pua_ttc') {
        updated.pua_ht = parseFloat((updated.pua_ttc / (fodecMultiplier * (1 + tvaRate))).toFixed(3));
      }
      if (name === 'puv_ttc') {
        updated.puv_ht = parseFloat((updated.puv_ttc / (fodecMultiplier * (1 + tvaRate))).toFixed(3));
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;
    
    setLoading(true);
    try {
      const response = await updateArticle(article.id, {
        ...article,
        ...formData,
        nom: formData.designation,
      });
      toast.success('Article modifié avec succès');
      onSuccess(response);
      toggle();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la modification de l'article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>Modifier l'article</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Référence *</Label>
                <Input required name="reference" value={formData.reference} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={8}>
              <FormGroup>
                <Label>Désignation *</Label>
                <Input required name="designation" value={formData.designation} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Catégorie</Label>
                <Input type="select" name="categorie_id" value={formData.categorie_id} onChange={handleChange}>
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Sous-Catégorie</Label>
                <Input type="select" name="sous_categorie_id" value={formData.sous_categorie_id} onChange={handleChange}>
                  <option value="">Sélectionnez une sous-catégorie</option>
                  {subCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Fournisseur</Label>
                <Input type="select" name="fournisseur_id" value={formData.fournisseur_id} onChange={handleChange}>
                  <option value="">Sélectionnez un fournisseur</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>{f.raison_sociale}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Prix Unitaire Achat (HT)</Label>
                <Input type="number" step="0.001" name="pua_ht" value={formData.pua_ht} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>TVA (%)</Label>
                <Input type="number" name="tva" value={formData.tva} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Prix Unitaire Achat (TTC)</Label>
                <Input type="number" step="0.001" name="pua_ttc" value={formData.pua_ttc} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Prix Unitaire Vente (HT)</Label>
                <Input type="number" step="0.001" name="puv_ht" value={formData.puv_ht} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Prix Unitaire Vente (TTC)</Label>
                <Input type="number" step="0.001" name="puv_ttc" value={formData.puv_ttc} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Remise (%)</Label>
                <Input type="number" name="remise" value={formData.remise} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Type</Label>
                <Input type="select" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Non Consigné">Non Consigné</option>
                  <option value="Consigné">Consigné</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Stock</Label>
                <Input type="number" name="qte" value={formData.qte} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4} className="d-flex align-items-center">
              <FormGroup switch className="mt-4">
                <Input type="switch" name="taux_fodec" checked={formData.taux_fodec} onChange={handleChange} />
                <Label check className="ms-2">FODEC (1%)</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle}>Annuler</Button>
          <Button color="primary" type="submit" disabled={loading}>
            {loading ? 'Modification...' : 'Modifier'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default EditArticleModal;
