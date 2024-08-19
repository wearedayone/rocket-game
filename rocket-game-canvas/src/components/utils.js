// Function to check if two rectangles intersect
export const doRectanglesIntersect = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

//func to generate random target positions
export const generateRandomTargetPositions = () => {
  // Generate two random target positions
  // at a square of 100 x 100 pixels in center of the screen
  let cornerTopX = window.innerWidth * 0.4;
  let cornerTopY = window.innerHeight * 0.4;
  const target1 = {
    x: cornerTopX + window.innerWidth * 0.1 * Math.random(),
    y: cornerTopY + window.innerWidth * 0.1 * Math.random(),
  };

  cornerTopX = window.innerWidth * 0.7;
  cornerTopY = window.innerHeight * 0.6;
  const target2 = {
    x: cornerTopX + window.innerWidth * 0.1 * Math.random(),
    y: cornerTopY + window.innerWidth * 0.1 * Math.random(),
  };
  return [target1, target2];
};
