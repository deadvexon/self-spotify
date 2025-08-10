import React from 'react';
import { useSelector } from 'react-redux';

const Player = () => {
  // Get the currently selected "track" (which is now an image) from Redux
  const { currentTrackId } = useSelector((state) => state.player);
  const { playlist } = useSelector((state) => state.room);

  const currentImage = playlist.find(item => item.id === currentTrackId);

  // Construct the full URL to the image via our API gateway
  const imageUrl = currentImage 
    ? `${process.env.REACT_APP_API_URL}/api/files${currentImage.file_url}`
    : null;

  console.log({
    step: 3,
    currentIdFromRedux: currentTrackId,
    foundImageObject: currentImage,
    finalImageUrl: imageUrl
  });

  return (
    <div>
      <h2>Image Viewer</h2>
      {imageUrl ? (
        <div>
          <p>Viewing: {currentImage.title}</p>
          <img src={imageUrl} alt={currentImage.title} style={{ maxWidth: '400px', maxHeight: '400px', border: '1px solid white' }} />
        </div>
      ) : (
        <p>No image selected. The host can select an image from the list.</p>
      )}
    </div>
  );
};

export default Player;
