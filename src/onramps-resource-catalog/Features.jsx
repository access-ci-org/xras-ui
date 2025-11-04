import React from "react";

const Features = ({ features, id }) => {
  const icons = {
    "ACCESS Pegasus":
      "https://pegasus.isi.edu/wordpress/wp-content/uploads/2016/01/favicon.ico",
    "ACCESS OnDemand":
      "https://openondemand.org/themes/fire/theme/assets/media/favicons/favicon.ico",
    "Advance reservations": "calendar-check",
    "Composable hardware fabric": "boxes",
    "Compute Resources": "cpu-fill",
    "CPU Compute": "cpu-fill",
    "GPU Compute": "gpu-card",
    "Innovative / Novel Compute": "lightbulb",
    "Large Memory Nodes": "arrows-fullscreen",
    Preemption: "clock-history",
    "Science Gateway support": "globe",
    "Service / Other": "stars",
    "Storage Resources": "hdd-fill",
    "Virtual Machines": "pc-display-horizontal",
    Cloud: "cloud",
    Storage: "hdd-fill",
  };

  const tagStyle = {
    fontFamily: "Archivo, sans-serif",
    color: "rgb(35, 35, 35)",
    backgroundColor: "rgb(206, 232, 233)",
    border: "1px solid #48c0b9",
    margin: "2px"
  }

  const icon = (f) => {
    const icon = icons[f];
    if(icon){
      return icon.startsWith("http") ? <img className="me-2" style={{ width: "12px" }} alt={`${f}-icon`} src={icon} />
        : <i className={`bi bi-${icons[f]} me-2`}></i>

    }

    return <></>;
  }

  return (
    <>
      {features.map((f, i) => {
        return (
          <span className='badge me-2' style={tagStyle} key={`feature_${id}_${i}`}>
            {icon(f)}{f}
          </span>
        );
      })}
    </>
  )

}

export default Features;