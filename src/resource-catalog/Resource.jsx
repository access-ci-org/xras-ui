import { useState } from 'react';

const Resource = ({ resource }) => {

  const [showShortDesc, setShowShortDesc] = useState(true);

  const featureIcon = (feature) => {
    const iconMap = {
      "CPU Compute": "cpu-fill",
      "GPU Compute": "gpu-card",
      "Cloud" : "cloud-fill",
      "Commercial Cloud" : "clouds-fill",
      "Storage": "database-fill",
      "Service / Other": "journal",
      "Innovative / Novel Compute": "pc",
    }

    if(iconMap[feature]) return (<i key={`${resource.resourceId}_${iconMap[feature]}`} title={feature} className={`bi bi-${iconMap[feature]} me-2 `}></i>);

    return '';
  }

  const renderResourceType = () => {
    return (
      <span className="float-end">
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
      if(content.length > 400 && showShortDesc){
        content = `${content.substring(0, 397)}...`;
        truncated = true;
      }

      const showMoreButton = (
        <button
          role='button'
          type='button'

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
              <div dangerouslySetInnerHTML={{ __html: content }} />
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
              <div dangerouslySetInnerHTML={{ __html: resource.recommendedUse }} />
            </div>
          </div>
        </>
      )
    }

    return '';
  }

  const headerBg = () => {
    return "";
    //return style.cardBg;
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <div className="card mb-3">
            <div className={`card-header ${headerBg()}`}>
              <span className={``}>
                {resource.resourceName}
              </span>
              { renderResourceType() }
            </div>
            <div className="card-body">
              <div className='row mb-3'>
                <div className='col'>
                  {renderFeatures(resource.features)}
                </div>
              </div>

              { renderDescription() }
              { renderUse() }


              {/* <div className='row'>
                <div className='col'>
                  <button className='btn btn-info me-2 fw-bold'>Learn More <i className='bi bi-box-arrow-up-right'></i></button>
                  <button className='btn btn-warning fw-bold'>Request This Resource <i className='bi bi-box-arrow-up-right'></i></button>
                </div>
              </div> */}
            </div>
            <div className='card-footer'>
            <button className='btn btn-info me-2 fw-bold'>Learn More <i className='bi bi-box-arrow-up-right'></i></button>

            </div>
          </div>
        </div>
      </div>

    </>
  )
};

export default Resource;
