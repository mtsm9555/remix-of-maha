interface Props {
  imageUrl: string;
  alt?: string;
}

export default function ImagePreview({ imageUrl, alt = "Uploaded" }: Props) {
  return (
    <div className="image-preview">
      <img src={imageUrl} alt={alt} />
    </div>
  );
}