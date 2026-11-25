import React, { useEffect, useState } from "react";
import { Badge, Button, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import {
  getImageUrl,
  uploadArticleMainImage,
  setArticleMainImage,
  removeArticleMainImage,
  uploadArticleWebsiteImages,
  removeArticleWebsiteImage,
} from "./ArticleServices";

export interface ArticleImages {
  image: string | null;
  website_images: string[];
}

interface Props {
  articleId: number;
  image?: string | null;
  websiteImages?: string[] | null;
  /** Called with the server's copy after every change. */
  onChange?: (images: ArticleImages) => void;
}

// Same limits as the backend (multer): 10 MB for the main image, 5 MB for the others.
const MAIN_MAX = 10 * 1024 * 1024;
const OTHER_MAX = 5 * 1024 * 1024;

/**
 * Main image + other images of one article. Every action is saved on the
 * server right away (no "Enregistrer" needed), so it can sit inside any form.
 * The main image is the one shown first on the website (product card, cart,
 * first picture of the product page).
 */
const ArticleImagesManager: React.FC<Props> = ({ articleId, image, websiteImages, onChange }) => {
  const [main, setMain] = useState<string | null>(image || null);
  const [others, setOthers] = useState<string[]>((websiteImages || []).filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const othersKey = (websiteImages || []).join("|");
  useEffect(() => {
    setMain(image || null);
    setOthers((websiteImages || []).filter(Boolean));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, image, othersKey]);

  const apply = (article: any) => {
    const next: ArticleImages = {
      image: article?.image || null,
      website_images: (article?.website_images || []).filter(Boolean),
    };
    setMain(next.image);
    setOthers(next.website_images);
    onChange?.(next);
  };

  const run = async (action: () => Promise<any>, success: string) => {
    setBusy(true);
    try {
      const res = await action();
      apply(res.article);
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Opération échouée");
    } finally {
      setBusy(false);
    }
  };

  const tooBig = (files: File[], max: number) => {
    const big = files.find((f) => f.size > max);
    if (big) {
      toast.error(`"${big.name}" dépasse ${Math.round(max / 1024 / 1024)} Mo`);
      return true;
    }
    return false;
  };

  const onMainFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || tooBig([file], MAIN_MAX)) return;
    run(
      () => uploadArticleMainImage(articleId, file),
      main
        ? "Image principale remplacée (l'ancienne est dans les autres images)"
        : "Image principale ajoutée"
    );
  };

  const onOtherFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || tooBig(files, OTHER_MAX)) return;
    if (files.length > 10) {
      toast.error("10 images maximum à la fois");
      return;
    }
    run(
      () => uploadArticleWebsiteImages(articleId, files),
      files.length > 1 ? `${files.length} images ajoutées` : "Image ajoutée"
    );
  };

  // Without a main image the website shows the first other image first,
  // so that one is labelled "Principale" too.
  const tiles = [
    ...(main ? [{ src: main, isMain: true, index: -1 }] : []),
    ...others.map((src, index) => ({ src, isMain: false, index })),
  ];

  const inputId = `art-img-${articleId}`;

  return (
    <div className="article-images-manager">
      {tiles.length === 0 ? (
        <div className="border rounded p-3 text-center text-muted mb-2">
          <i className="ri-image-line fs-1 d-block mb-1"></i>
          Aucune image pour cet article
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-2 mb-2">
          {tiles.map((t, i) => {
            const url = getImageUrl(t.src);
            const isCover = i === 0;
            return (
              <div
                key={t.src + i}
                className={`position-relative rounded border ${isCover ? "border-success border-2" : ""}`}
                style={{ width: 112, height: 112, overflow: "hidden", background: "#f3f3f9" }}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  onClick={() => setPreview(url)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
                />
                {isCover && (
                  <Badge color="success" className="position-absolute top-0 start-0 m-1">
                    <i className="ri-star-fill me-1"></i>Principale
                  </Badge>
                )}
                <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-between p-1">
                  {!isCover ? (
                    <Button
                      type="button"
                      color="light"
                      size="sm"
                      className="py-0 px-1"
                      title="Définir comme image principale"
                      disabled={busy}
                      onClick={() =>
                        run(() => setArticleMainImage(articleId, t.index), "Image principale choisie")
                      }
                    >
                      <i className="ri-star-line"></i>
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button
                    type="button"
                    color="danger"
                    size="sm"
                    className="py-0 px-1"
                    title="Supprimer cette image"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm("Supprimer cette image ?")) return;
                      run(
                        () =>
                          t.isMain
                            ? removeArticleMainImage(articleId)
                            : removeArticleWebsiteImage(articleId, t.index),
                        "Image supprimée"
                      );
                    }}
                  >
                    <i className="ri-delete-bin-line"></i>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="d-flex flex-wrap align-items-center gap-2">
        <label
          htmlFor={`${inputId}-main`}
          className={`btn btn-sm btn-outline-success mb-0 ${busy ? "disabled" : ""}`}
        >
          <i className="ri-image-add-line me-1"></i>
          {main ? "Remplacer l'image principale" : "Ajouter l'image principale"}
        </label>
        <input
          id={`${inputId}-main`}
          type="file"
          accept="image/*"
          className="d-none"
          disabled={busy}
          onChange={onMainFile}
        />
        <label
          htmlFor={`${inputId}-others`}
          className={`btn btn-sm btn-outline-primary mb-0 ${busy ? "disabled" : ""}`}
        >
          <i className="ri-upload-2-line me-1"></i>
          Ajouter d'autres images
        </label>
        <input
          id={`${inputId}-others`}
          type="file"
          accept="image/*"
          multiple
          className="d-none"
          disabled={busy}
          onChange={onOtherFiles}
        />
        {busy && <Spinner size="sm" color="primary" />}
      </div>
      <small className="text-muted d-block mt-2">
        <i className="ri-star-line"></i> = choisir l'image principale (affichée en premier sur le site).
        Les images sont enregistrées immédiatement. JPG / PNG / WEBP, 5 Mo max par image.
      </small>

      <Modal isOpen={!!preview} toggle={() => setPreview(null)} size="lg" centered>
        <ModalHeader toggle={() => setPreview(null)}>Aperçu de l'image</ModalHeader>
        <ModalBody className="text-center">
          {preview && (
            <img src={preview} alt="" className="img-fluid" style={{ maxHeight: "70vh", objectFit: "contain" }} />
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ArticleImagesManager;
