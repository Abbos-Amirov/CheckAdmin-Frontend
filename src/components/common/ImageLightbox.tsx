import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageLightbox.module.scss';

type Props = {
  src: string | null;
  alt?: string;
  onClose: () => void;
};

export function ImageLightbox({ src, alt = '', onClose }: Props) {
  useEffect(() => {
    if (!src) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
        ×
      </button>
      <img
        src={src}
        alt={alt}
        className={styles.image}
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
