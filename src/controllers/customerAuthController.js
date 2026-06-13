import Customer from "../models/customer.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// customer Signup
export const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;


        //  check  if user already exist
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({
                meaasage: "Email already Registered"
            })
        }

        // Create the customer
        const customer = await Customer.create({
            name,
            email,
            password,
            Phone: phone
        });

        res.status(201).json({
            success: true,
            data: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                profileImage: customer.profileImage,
                token: generateToken(customer._id),
            }
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// customer Login 
export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const customerData = await Customer.findOne({ email }).select("+password");
        if (!customerData) {
            return res.status(404).json({
                message: 'Invalid email or password'
            });
        }

        const isMatch = await customerData.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: customerData._id,
                name: customerData.name,
                email: customerData.email,
                Phone: customerData.Phone,
                profileImage: customerData.profileImage,
                token: generateToken(customerData._id)
            }
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Update Customer Profile
export const updateCustomerProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const customerId = decoded.id;
        const { name, Phone, basicInfo, profileImage } = req.body;
        
        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { name, Phone, basicInfo, profileImage },
            { new: true }
        );

        if (!customer) return res.status(404).json({ message: "Customer not found" });

        res.status(200).json({
            success: true,
            data: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                Phone: customer.Phone,
                profileImage: customer.profileImage,
                basicInfo: customer.basicInfo,
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Customers (Admin)
export const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};