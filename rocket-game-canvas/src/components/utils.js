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
  const target1 = {
    x: Math.random() * 1000,
    y: Math.random() * 1000,
  };
  const target2 = {
    x: Math.random() * 1000,
    y: Math.random() * 1000,
  };
  return [target1, target2];
};
