import Policy from "../models/PolicyModel.js";

// Fetch Policy (By type, category, and destination)
export const getPolicy = async (req, res) => {
  try {
    const { type, category, destination } = req.query; // Query params se data lenge
    
    // Search with matching params, default values use karenge agar nahi milte
    const policy = await Policy.findOne({ 
      type, 
      category: category || "General", 
      destination: destination || "General" 
    });
    
    res.status(200).json({ 
      success: true, 
      data: policy || { content: "" } // Agar nahi mila to khali content bhejenge
    });
  } catch (error) {
    next(new AppError("Failed to fetch policy", 500));
  }
};

// Save or Update Policy (Upsert)
export const savePolicy = async (req, res) => {
  try {
    const { type, category, destination, content } = req.body;
    
    // findOneAndUpdate with unique index match
    const policy = await Policy.findOneAndUpdate(
      { 
        type, 
        category: category || "General", 
        destination: destination || "General" 
      },
      { content },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({ 
      success: true, 
      message: `${type} saved successfully!`,
      data: policy 
    });
  } catch (error) {
    next(new AppError("Failed to save policy", 500));
  }
};
