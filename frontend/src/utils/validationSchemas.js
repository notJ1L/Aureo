// Unit 1: form validation with Yup.
//
// The schemas mirror the Mongoose models so the browser rejects the same
// input the API would reject. The backend still validates every request;
// these rules only give the user immediate feedback.
//
// Every schema is used with React Hook Form through @hookform/resolvers.

import * as Yup from "yup";

const requiredText = (label, { min = 1, max = 200 } = {}) =>
    Yup.string()
        .trim()
        .min(min, `${label} must be at least ${min} characters.`)
        .max(max, `${label} cannot exceed ${max} characters.`)
        .required(`${label} is required.`);

const emailField = Yup.string()
    .trim()
    .email("Enter a valid email address.")
    .required("Email is required.");

export const loginSchema = Yup.object({
    email: emailField,
    password: Yup.string().required("Password is required.")
});

export const registerSchema = Yup.object({
    name: requiredText("Name", { min: 2, max: 60 }),
    email: emailField,
    password: Yup.string()
        .min(8, "Password must be at least 8 characters.")
        .max(72, "Password cannot exceed 72 characters.")
        .required("Password is required.")
});

export const verifyCodeSchema = Yup.object({
    email: emailField,
    code: Yup.string()
        .trim()
        .matches(/^[0-9]{6}$/, "Enter the 6-digit code from your email.")
        .required("Verification code is required.")
});

export const profileSchema = Yup.object({
    name: requiredText("Full name", { min: 2, max: 60 }),
    contactNumber: Yup.string()
        .trim()
        .matches(/^[+\d][\d\s()\-.]{6,19}$/, "Enter a valid contact number.")
        .nullable()
        .default(""),
    addressLine: Yup.string().trim().max(200, "Address is too long.").default(""),
    city: Yup.string().trim().max(60, "City name is too long.").default(""),
    postalCode: Yup.string()
        .trim()
        .matches(/^\d{4}$/, "Enter a 4-digit postal code.")
        .default(""),
    country: Yup.string().trim().max(60, "Country name is too long.").default("")
});

export const productSchema = Yup.object({
    name: requiredText("Product name", { min: 2, max: 150 }),
    brand: requiredText("Brand", { min: 2, max: 60 }),
    category: requiredText("Category", { min: 2, max: 60 }),
    movement: Yup.string()
        .oneOf(["automatic", "quartz", "manual"], "Choose a valid movement.")
        .required("Movement is required."),
    caseSize: Yup.number()
        .typeError("Case size must be a number.")
        .min(1, "Case size must be greater than zero.")
        .max(70, "Case size must be 70mm or smaller.")
        .required("Case size is required."),
    condition: Yup.string()
        .oneOf(["new", "second-hand"], "Choose a valid condition.")
        .required("Condition is required."),
    price: Yup.number()
        .typeError("Price must be a number.")
        .min(0, "Price cannot be negative.")
        .required("Price is required."),
    description: requiredText("Description", { min: 10, max: 2000 }),
    stock: Yup.number()
        .typeError("Stock must be a number.")
        .min(0, "Stock cannot be negative.")
        .integer("Stock must be a whole number.")
        .required("Stock is required.")
        .test(
            "second-hand-single-unit",
            "Second-hand watches can only have one unit in stock.",
            function (value) {
                if (this.parent.condition !== "second-hand") {
                    return true;
                }

                // A second-hand piece is a single unit. Zero is allowed because
                // that is the state of a piece that has already been sold.
                return [0, 1].includes(Number(value));
            }
        )
});

export const reviewSchema = Yup.object({
    rating: Yup.number()
        .typeError("Choose a rating between 1 and 5.")
        .integer("Rating must be a whole number.")
        .min(1, "Rating must be between 1 and 5.")
        .max(5, "Rating must be between 1 and 5.")
        .required("A rating is required."),
    comment: Yup.string()
        .trim()
        .min(10, "Tell us a little more, at least 10 characters.")
        .max(1000, "Review cannot exceed 1000 characters.")
        .required("A review comment is required.")
});

export const checkoutSchema = Yup.object({
    addressLine: requiredText("Street address", { min: 5, max: 200 }),
    city: requiredText("City", { min: 2, max: 60 }),
    postalCode: Yup.string()
        .trim()
        .matches(/^\d{4}$/, "Enter a 4-digit postal code.")
        .required("Postal code is required."),
    country: requiredText("Country", { min: 2, max: 60 }),
    contactNumber: Yup.string()
        .trim()
        .matches(/^[+\d][\d\s()\-.]{6,19}$/, "Enter a valid contact number.")
        .required("Contact number is required.")
});

export const schemas = {
    login: loginSchema,
    register: registerSchema,
    verifyCode: verifyCodeSchema,
    profile: profileSchema,
    product: productSchema,
    review: reviewSchema,
    checkout: checkoutSchema
};

export default schemas;
