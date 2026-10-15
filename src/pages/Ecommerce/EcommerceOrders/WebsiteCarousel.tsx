import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card, CardBody, Col, Container, CardHeader, Row, Modal, ModalHeader,
  Form, ModalBody, Label, Input, Button
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  fetchCarouselSlides, createCarouselSlide, updateCarouselSlide,
  deleteCarouselSlide, CarouselSlide, getImageUrl
} from "../../../Components/Article/CarouselServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const c = (hex || '#000000').replace('#', '').padEnd(6, '0');
  return {
    r: parseInt(c.substring(0, 2), 16) || 0,
    g: parseInt(c.substring(2, 4), 16) || 0,
    b: parseInt(c.substring(4, 6), 16) || 0,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, v || 0)).toString(16).padStart(2, '0'))
    .join('');
}

function isColorLight(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

// ─── Color Picker (native spectrum + RGB + HEX) ───────────────────────────────

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const rgb = hexToRgb(value);
  const [hexInput, setHexInput] = useState(value || '#000000');

  const setChannel = (ch: 'r' | 'g' | 'b', v: number) => {
    const next = { ...rgb, [ch]: Math.max(0, Math.min(255, v || 0)) };
    const hex = rgbToHex(next.r, next.g, next.b);
    onChange(hex);
    setHexInput(hex);
  };

  const handleHexChange = (raw: string) => {
    setHexInput(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw);
  };

  const handleNativeChange = (hex: string) => {
    onChange(hex);
    setHexInput(hex);
  };

  return (
    <div>
      {/* Spectrum picker + swatch + hex */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: value || '#000000',
            border: '1px solid #dee2e6',
            cursor: 'pointer',
          }} />
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
            onChange={e => handleNativeChange(e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer', border: 'none',
            }}
            title="Ouvrir le sélecteur de couleur"
          />
        </div>
        <small className="text-muted" style={{ fontSize: 10, lineHeight: 1.3 }}>
          Cliquez sur le<br />carré pour ouvrir<br />la palette complète
        </small>
        <Input
          type="text"
          value={hexInput}
          onChange={e => handleHexChange(e.target.value)}
          style={{ width: 95, fontSize: 12, fontFamily: 'monospace', padding: '6px 8px' }}
          placeholder="#000000"
        />
      </div>

      {/* RGB inputs */}
      <div className="d-flex gap-2">
        {(['r', 'g', 'b'] as const).map(ch => (
          <div key={ch} style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 3,
              color: ch === 'r' ? '#dc3545' : ch === 'g' ? '#198754' : '#0d6efd',
            }}>
              {ch.toUpperCase()}
            </div>
            <Input
              type="number" min={0} max={255}
              value={rgb[ch]}
              onChange={e => setChannel(ch, parseInt(e.target.value))}
              style={{ textAlign: 'center', padding: '4px 2px', fontSize: 12 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tiny inline color dot picker (for text colors) ──────────────────────────

interface TextColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}

const TextColorPicker: React.FC<TextColorPickerProps> = ({ value, onChange, label }) => {
  const [hexInput, setHexInput] = useState(value || '#ffffff');
  const handleNative = (hex: string) => { onChange(hex); setHexInput(hex); };
  const handleHex = (raw: string) => {
    setHexInput(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw);
  };

  return (
    <div className="mb-3">
      <Label className="form-label">{label}</Label>
      <div className="d-flex align-items-center gap-2">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 6,
            background: value || '#ffffff',
            border: '1px solid #dee2e6', cursor: 'pointer',
          }} />
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff'}
            onChange={e => handleNative(e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer', border: 'none',
            }}
          />
        </div>
        <Input
          type="text"
          value={hexInput}
          onChange={e => handleHex(e.target.value)}
          style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', padding: '6px 8px' }}
          placeholder="#ffffff"
        />
        {/* Quick whites/black */}
        {['#ffffff', '#000000', '#f8f9fa', '#adb5bd'].map(c => (
          <button key={c} type="button" onClick={() => { onChange(c); setHexInput(c); }}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 4, flexShrink: 0,
              background: c, border: value === c ? '2px solid #0d6efd' : '1px solid #dee2e6',
              cursor: 'pointer',
            }} />
        ))}
      </div>
    </div>
  );
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="d-flex align-items-center justify-content-between mb-3 pb-2"
    style={{ borderBottom: '2px solid #f0f0f0' }}>
    <span className="fw-semibold text-uppercase"
      style={{ fontSize: 11, letterSpacing: '0.08em', color: '#6c757d' }}>
      {title}
    </span>
    {children}
  </div>
);

const ToggleSwitch = ({ name, checked, onChange, label }:
  { name: string; checked: boolean; onChange: any; label: string }) => (
  <div className="form-check form-switch d-flex align-items-center gap-2 mb-0">
    <Input name={name} type="checkbox" className="form-check-input" role="switch"
      onChange={onChange} checked={checked} id={`sw-${name}`}
      style={{ cursor: 'pointer', width: 36, height: 20 }} />
    <Label className="form-check-label mb-0" htmlFor={`sw-${name}`}
      style={{ cursor: 'pointer', fontSize: 13 }}>
      {label}
    </Label>
  </div>
);

const BtnPreview = ({ label, bgColor, textColor }: { label: string; bgColor: string; textColor: string }) => (
  <span style={{
    display: 'inline-block', padding: '7px 18px', borderRadius: 8,
    background: bgColor || '#000000',
    color: textColor || (isColorLight(bgColor) ? '#000' : '#fff'),
    fontSize: 13, fontWeight: 500,
  }}>
    {label || 'Bouton'}
  </span>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const WebsiteCarousel = () => {
  const [modal, setModal] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [slide, setSlide] = useState<CarouselSlide | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setSlides(await fetchCarouselSlides());
    } catch {
      toast.error("Échec du chargement des bannières");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!slide) return;
    try {
      await deleteCarouselSlide(slide.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Bannière supprimée");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    const fd = new FormData();
    const s = (k: string) => fd.append(k, values[k] ?? '');
    const b = (k: string) => fd.append(k, String(values[k]));

    ['title','subtitle','description',
     'tag_color','title_color','description_color',
     'link','btn_label','btn_color','btn1_text_color',
     'btn2_label','btn2_link','btn2_color','btn2_text_color'].forEach(s);
    ['show_text','show_btn1','show_btn2','active'].forEach(b);
    fd.append('order', String(values.order || 0));

    if (selectedImage) {
      fd.append('image', selectedImage);
    } else if (!isEdit) {
      toast.error("Une image est obligatoire");
      return;
    }

    try {
      if (isEdit && slide) {
        await updateCarouselSlide(slide.id, fd);
        toast.success("Bannière mise à jour");
      } else {
        await createCarouselSlide(fd);
        toast.success("Bannière ajoutée");
      }
      setModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
    } catch {
      toast.error("Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title:             slide?.title             || '',
      subtitle:          slide?.subtitle           || '',
      description:       slide?.description        || '',
      tag_color:         slide?.tag_color          || '#ffffff',
      title_color:       slide?.title_color        || '#ffffff',
      description_color: slide?.description_color  || '#ffffff',
      link:              slide?.link               || '',
      btn_label:         slide?.btn_label          || '',
      btn_color:         slide?.btn_color          || '#00adee',
      btn1_text_color:   slide?.btn1_text_color    || '#ffffff',
      btn2_label:        slide?.btn2_label         || '',
      btn2_link:         slide?.btn2_link          || '',
      btn2_color:        slide?.btn2_color         || '#080808',
      btn2_text_color:   slide?.btn2_text_color    || '#ffffff',
      show_text:         slide?.show_text          ?? true,
      show_btn1:         slide?.show_btn1          ?? true,
      show_btn2:         slide?.show_btn2          ?? true,
      order:             slide?.order              || 0,
      active:            slide?.active             ?? true,
    },
    validationSchema: Yup.object({}),
    onSubmit: handleSubmit,
  });

  const sv = validation.values;
  const set = (k: string) => (v: string) => validation.setFieldValue(k, v);

  const columns = useMemo(() => [
    {
      header: "Image", accessorKey: "image", enableColumnFilter: false,
      cell: (cell: any) => (
        <img src={getImageUrl(cell.getValue())} alt="slide" className="rounded"
          style={{ width: 120, height: 60, objectFit: 'cover' }} />
      )
    },
    { header: "Titre", accessorKey: "title", enableColumnFilter: false },
    { header: "Ordre", accessorKey: "order", enableColumnFilter: false },
    {
      header: "Action", enableColumnFilter: false,
      cell: (cp: any) => (
        <ul className="list-inline hstack gap-2 mb-0">
          <li className="list-inline-item">
            <Link to="#" className="text-primary d-inline-block"
              onClick={() => { setSlide(cp.row.original); setIsEdit(true); setModal(true); }}>
              <i className="ri-pencil-fill fs-16"></i>
            </Link>
          </li>
          <li className="list-inline-item">
            <Link to="#" className="text-danger d-inline-block"
              onClick={() => { setSlide(cp.row.original); setDeleteModal(true); }}>
              <i className="ri-delete-bin-5-fill fs-16"></i>
            </Link>
          </li>
        </ul>
      )
    }
  ], []);

  const toggleModal = useCallback(() => {
    if (modal) { setModal(false); setSlide(null); setSelectedImage(null); setImagePreview(null); }
    else setModal(true);
  }, [modal]);

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Carousel" pageTitle="Site Web" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion du Carousel Accueil</h5>
                  </div>
                  <div className="col-sm-auto">
                    <Button color="secondary"
                      onClick={() => { setIsEdit(false); setSlide(null); toggleModal(); }}>
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter une Image
                    </Button>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? <Loader /> : (
                  <TableContainer columns={columns} data={slides} isGlobalFilter={false}
                    customPageSize={10} divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase" />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={toggleModal} centered size="xl">
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier Bannière" : "Ajouter une Bannière"}
          </ModalHeader>
          <Form onSubmit={validation.handleSubmit}>
            <ModalBody style={{ maxHeight: '78vh', overflowY: 'auto' }}>

              {/* ── IMAGE ─────────────────────────────────────────── */}
              <div className="mb-4">
                <SectionHeader title="Image" />
                <div className="border rounded p-3 text-center">
                  {(imagePreview || slide?.image) ? (
                    <div className="mb-2">
                      <img src={imagePreview || getImageUrl(slide?.image)} alt="Preview"
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: 150, width: '100%', objectFit: 'cover' }} />
                      <Label htmlFor="img-up" className="btn btn-sm btn-outline-primary">
                        Changer l'image
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
                      <Label htmlFor="img-up" className="btn btn-outline-primary">
                        Télécharger l'image
                      </Label>
                    </div>
                  )}
                  <Input id="img-up" name="image" type="file" accept="image/*"
                    onChange={handleImageUpload} className="d-none" />
                </div>
              </div>

              {/* ── TEXTE ─────────────────────────────────────────── */}
              <div className="mb-4">
                <SectionHeader title="Texte du slide">
                  <ToggleSwitch name="show_text" checked={sv.show_text}
                    onChange={validation.handleChange} label="Afficher le texte" />
                </SectionHeader>
                <Row>
                  {/* Tag */}
                  <Col md={8}>
                    <div className="mb-3">
                      <Label className="form-label">Tag / Étiquette</Label>
                      <Input name="title" placeholder="Ex: Nouvelle Collection · Été 2025"
                        onChange={validation.handleChange} value={sv.title} />
                      <small className="text-muted">Petit texte au-dessus du titre</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <TextColorPicker value={sv.tag_color} onChange={set('tag_color')}
                      label="Couleur du tag" />
                  </Col>

                  {/* Titre principal */}
                  <Col md={8}>
                    <div className="mb-3">
                      <Label className="form-label">Titre Principal</Label>
                      <Input name="subtitle" placeholder="Ex: Timeless Elegance"
                        onChange={validation.handleChange} value={sv.subtitle} />
                    </div>
                  </Col>
                  <Col md={4}>
                    <TextColorPicker value={sv.title_color} onChange={set('title_color')}
                      label="Couleur du titre" />
                  </Col>

                  {/* Description */}
                  <Col md={8}>
                    <div className="mb-0">
                      <Label className="form-label">Description</Label>
                      <Input name="description" type="textarea" rows={2}
                        placeholder="Laisser vide pour ne pas afficher"
                        onChange={validation.handleChange} value={sv.description} />
                    </div>
                  </Col>
                  <Col md={4}>
                    <TextColorPicker value={sv.description_color} onChange={set('description_color')}
                      label="Couleur description" />
                  </Col>
                </Row>
              </div>

              {/* ── BOUTON 1 ──────────────────────────────────────── */}
              <div className="mb-4">
                <SectionHeader title="Bouton Principal">
                  <ToggleSwitch name="show_btn1" checked={sv.show_btn1}
                    onChange={validation.handleChange} label="Afficher" />
                </SectionHeader>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">Texte</Label>
                      <Input name="btn_label" placeholder="Ex: Découvrir"
                        onChange={validation.handleChange} value={sv.btn_label} />
                    </div>
                    <div className="mb-3">
                      <Label className="form-label">Lien (destination)</Label>
                      <Input name="link" placeholder="shop / offers / about / contact"
                        onChange={validation.handleChange} value={sv.link} />
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <Label className="form-label">Couleur fond</Label>
                      <ColorPicker value={sv.btn_color} onChange={set('btn_color')} />
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <Label className="form-label">Couleur texte</Label>
                      <ColorPicker value={sv.btn1_text_color} onChange={set('btn1_text_color')} />
                    </div>
                  </Col>
                  <Col md={12}>
                    <Label className="form-label d-block">Aperçu</Label>
                    <BtnPreview label={sv.btn_label} bgColor={sv.btn_color}
                      textColor={sv.btn1_text_color} />
                  </Col>
                </Row>
              </div>

              {/* ── BOUTON 2 ──────────────────────────────────────── */}
              <div className="mb-4">
                <SectionHeader title="Bouton Secondaire">
                  <ToggleSwitch name="show_btn2" checked={sv.show_btn2}
                    onChange={validation.handleChange} label="Afficher" />
                </SectionHeader>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">Texte</Label>
                      <Input name="btn2_label" placeholder="Ex: Notre Histoire"
                        onChange={validation.handleChange} value={sv.btn2_label} />
                    </div>
                    <div className="mb-3">
                      <Label className="form-label">Lien (destination)</Label>
                      <Input name="btn2_link" placeholder="about / shop / contact"
                        onChange={validation.handleChange} value={sv.btn2_link} />
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <Label className="form-label">Couleur fond</Label>
                      <ColorPicker value={sv.btn2_color} onChange={set('btn2_color')} />
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <Label className="form-label">Couleur texte</Label>
                      <ColorPicker value={sv.btn2_text_color} onChange={set('btn2_text_color')} />
                    </div>
                  </Col>
                  <Col md={12}>
                    <Label className="form-label d-block">Aperçu</Label>
                    <BtnPreview label={sv.btn2_label} bgColor={sv.btn2_color}
                      textColor={sv.btn2_text_color} />
                  </Col>
                </Row>
              </div>

              {/* ── PARAMÈTRES ────────────────────────────────────── */}
              <div>
                <SectionHeader title="Paramètres" />
                <Row className="align-items-center">
                  <Col md={3}>
                    <div className="mb-3">
                      <Label className="form-label">Ordre d'affichage</Label>
                      <Input name="order" type="number"
                        onChange={validation.handleChange} value={sv.order} />
                    </div>
                  </Col>
                  <Col md={9} className="mb-3">
                    <Label className="form-label d-block">Statut</Label>
                    <ToggleSwitch name="active" checked={sv.active}
                      onChange={validation.handleChange}
                      label="Slide actif (visible sur le site)" />
                  </Col>
                </Row>
              </div>

            </ModalBody>
            <div className="modal-footer">
              <Button type="button" color="light" onClick={toggleModal}>Fermer</Button>
              <Button type="submit" color="success">
                {isEdit ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </Form>
        </Modal>

        <ToastContainer />
      </Container>
    </div>
  );
};

export default WebsiteCarousel;
