const Category = require('../models/category');

// Create a new category
const createCategory = async (req, res) => {
    try {
        console.log(req.body);
        const category = await Category.create(req.body);
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all categories
const getCategory = async (req, res) => {
    try {
        const category = await Category.find();
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a category by ID
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a category by ID
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createCategory, getCategory, updateCategory, deleteCategory };
