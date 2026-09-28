import { useState, type ImgHTMLAttributes } from "react";

type SkeletonImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
};

export default function SkeletonImage({ wrapperClassName = "", className = "", onLoad, onError, ...props }: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={`skeleton-image ${loaded ? "is-loaded" : ""} ${wrapperClassName}`}>
      {!loaded && <span className="image-skeleton" aria-hidden="true" />}
      <img
        {...props}
        className={`skeleton-image-img ${className}`}
        onLoad={event => { setLoaded(true); onLoad?.(event); }}
        onError={event => { setLoaded(true); onError?.(event); }}
      />
    </span>
  );
}
