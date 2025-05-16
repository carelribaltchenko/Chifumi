export function getColoredHand(handColor: string, gesture: string) {
    const handMap: Record<string, string> = {
      rock: "✊",
      paper: "🖐",
      scissors: "✌️",
    };
  
    // Combine main et couleur choisie
    const base = handMap[gesture] || "❓";
    return base + (handColor?.codePointAt(0) ? handColor.slice(2) : ""); // garde la couleur peau si main du type 🖐🏽
  }
  