
export const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadComic = async (panelUrls: string[], filename: string = 'comic.png') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const panelSize = 1024; // Assuming generated images are square
  const gap = 40;
  
  // Layout: 2x2 grid
  canvas.width = panelSize * 2 + gap * 3;
  canvas.height = panelSize * 2 + gap * 3;
  
  ctx.fillStyle = '#1f2937'; // bg-gray-800
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imagePromises = panelUrls.map(url => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  });

  try {
    const images = await Promise.all(imagePromises);
    const positions = [
      { x: gap, y: gap },
      { x: panelSize + gap * 2, y: gap },
      { x: gap, y: panelSize + gap * 2 },
      { x: panelSize + gap * 2, y: panelSize + gap * 2 },
    ];

    images.forEach((img, index) => {
      if (positions[index]) {
        const { x, y } = positions[index];
        ctx.drawImage(img, x, y, panelSize, panelSize);
      }
    });
    
    const finalUrl = canvas.toDataURL('image/png');
    downloadImage(finalUrl, filename);
  } catch (error) {
    console.error("Failed to load images for comic canvas", error);
    alert("There was an error creating the comic image for download.");
  }
};