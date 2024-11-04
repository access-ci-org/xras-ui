export const sortResources = (resources) => {
    return [...resources].sort((a, b) => {
      if (a.relative_order === null && b.relative_order === null) {
        return a.display_resource_name.localeCompare(b.display_resource_name);
      }
      if (a.relative_order === null) return 1;
      if (b.relative_order === null) return -1;
      return a.relative_order - b.relative_order;
    });
  };
  
  export const startScrolling = (direction, scrollIntervalRef) => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      window.scrollBy(0, direction * 10);
    }, 16);
  };
  
  export const stopScrolling = (scrollIntervalRef) => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };