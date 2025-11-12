import { useState } from 'react';
import styles from "./ResourceCatalog.module.scss";

const Resource = ({ resource }) => {

  const [showShortDesc, setShowShortDesc] = useState(true);

  const featureIcon = (feature) => {
    const iconMap = {
      "CPU Compute": "cpu-fill",
      "GPU Compute": "gpu-card",
      "Cloud" : "cloud-fill",
      "Commercial Cloud" : "cloud-fill",
      "Storage": "database-fill",
      "Service / Other": "journal",
      "Innovative / Novel Compute": "pc",
    }

    if(iconMap[feature]) return (<i key={`${resource.resourceId}_${iconMap[feature]}`} title={feature} className={`bi bi-${iconMap[feature]} me-2 `}></i>);

    return '';
  }

  const renderResourceType = () => {
    return (
      <span className="float-end" style={{ color: "#fff" }}>
        {resource.features.map((f) => featureIcon(f))}
        {resource.resourceType}
      </span>
    )
  }

  const renderFeatures = (features) => {
    if (features.length == 0) {
      return "";
    }

    return (
      <>
        {features.map((f, i) => {
          return (<span className='badge text-bg-secondary me-2' key={`feature_${resource.resourceId}_${i}`}>{f}</span>);
        })}
      </>
    );
  };

  const renderDescription = () => {
    let content = resource.resourceDescription;
    let truncated = false;

    if (content && content != "") {
      // if(content.length > 400 && showShortDesc){
      //   content = `${content.substring(0, 397)}...`;
      //   truncated = true;
      // }

      const showMoreButton = (
        <button
          role='button'
          type='button'
          className={styles.plainButton}
          onClick={() => setShowShortDesc(false)}
        >
          Read More
        </button>
      )

      return (
        <>
          <div className="row">
            <div className="col fw-bold">
              About {resource.resourceName}
            </div>
          </div>
          <div className="row mb-3">
            <div className={`col `}>
              <div className={styles.description} dangerouslySetInnerHTML={{ __html: content }} />
              {truncated ? showMoreButton : ''}
            </div>
          </div>
        </>
      );
    }
    return "";
  };

  const renderUse = () => {

    if(resource.recommendedUse && resource.recommendedUse != ''){
      return (
        <>
          <div className="row">
            <div className="col fw-bold">
              Recommended Use
            </div>
          </div>
          <div className='row mb-3'>
            <div className='col'>
              <div className={styles.description} dangerouslySetInnerHTML={{ __html: resource.recommendedUse }} />
            </div>
          </div>
        </>
      )
    }

    return '';
  }

  const headerBg = () => {
    return styles.cardBg;
  }

  const renderHeader = () => {

    const headerStyle = {
      background: "linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(26, 91, 110, 1) 50%)",
      display: "flex",
      justifyContent: "space-between"
    }

    return (
      <div className={`card-header`} style={headerStyle}>
        <span style={{ fontWeight: "bold" }}>
          { renderLogo() }
          { resource.resourceName }
        </span>
        { renderResourceType() }
      </div>
    )
  }

  const renderLogo = () => {
    if(!resource.logo) return

    const logoClass = {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }

    return (
      <img style={{ width: "20px", marginRight: "5px" }} src={`${resource.logo}`} />
    )
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <div className="card mb-3">
            { renderHeader() }
            <div className="card-body">
              <div className='row mb-3'>
                <div className='col'>
                  {renderFeatures(resource.features)}
                </div>
              </div>
              { renderUse() }
              { renderDescription() }
            </div>
            <div className='card-footer'>
              <a target='_blank' href={resource.userGuideUrl} className='btn btn-info me-2 fw-bold'>System Info <i className='bi bi-box-arrow-up-right'></i></a>

            </div>
          </div>
        </div>
      </div>

    </>
  )
};

export default Resource;
