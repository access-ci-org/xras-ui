import { featureIconImages, featureIcons } from "./helpers/icons";

const Features = ({ features, id }: { features: string[]; id: number }) => {
  const icon = (f: string) => {
    const imageSrc = featureIconImages[f];
    if (imageSrc) {
      return <img className="mr-2 inline size-3" alt={`${f}-icon`} src={imageSrc} />;
    }

    const Icon = featureIcons[f];
    if (Icon) {
      return <Icon className="mr-2 inline size-4" />;
    }

    return <></>;
  };

  return (
    <>
      {features.map((f, i) => (
        <span
          className="m-0.5 inline-flex items-center border px-2 py-1 text-sm"
          style={{
            fontFamily: "Archivo, sans-serif",
            color: "rgb(35, 35, 35)",
            backgroundColor: "rgb(206, 232, 233)",
            borderColor: "#48c0b9",
          }}
          key={`feature_${id}_${i}`}
        >
          {icon(f)}
          {f}
        </span>
      ))}
    </>
  );
};

export default Features;
