import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  CardBody,
  Button,
  Label,
  Input,
  FormFeedback,
  Form,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useProfile } from "Components/Hooks/UserHooks";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  is_active: boolean;
  company_name: string;
  company_address: string;
  company_city: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_logo: string;
  company_gsm: string; // Added GSM field
  created_at: string;
  updated_at: string;
  token: string;
}

interface FormValues {
  first_name: string;
  last_name: string;
  username: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_gsm: string; // Added GSM field
  company_address: string;
  company_city: string;
  company_website: string;
  company_logo: File | null;
  company_tax_id: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile = () => {
  const { userProfile, loading, token } = useProfile();
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [passwordModal, setPasswordModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE = process.env.REACT_APP_API_BASE;

  // Debug: log the userProfile structure
  useEffect(() => {
    console.log("UserProfile data:", userProfile);
    if (userProfile?.company_logo) {
      setLogoPreview(userProfile.company_logo);
    }
  }, [userProfile]);

  // Handle logo file selection
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Update formik value
      validation.setFieldValue("company_logo", file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update user profile
  const updateProfile = async (values: FormValues) => {
    try {
      setError("");
      setSuccess("");

      if (!userProfile) {
        setError("No user data found");
        return;
      }

      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("company_name", values.company_name);
      formData.append("company_email", values.company_email);
      formData.append("company_phone", values.company_phone);
      formData.append("company_gsm", values.company_gsm); // Added GSM field
      formData.append("company_address", values.company_address);
      formData.append("company_city", values.company_city);
      formData.append("company_website", values.company_website);
      formData.append("id", userProfile.id.toString());
      formData.append("company_tax_id", values.company_tax_id); // Add this line

      if (values.company_logo) {
        formData.append("company_logo", values.company_logo);
      }

      const response = await fetch(`${API_BASE}/Auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update sessionStorage with new user data
        sessionStorage.setItem("authUser", JSON.stringify(data.user));
        setSuccess("Profile updated successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);

        // Reload page to reflect changes
        window.location.reload();
      } else {
        setError(data.message || "Error updating profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Error updating profile");
    }
  };

  // Change password
  const changePassword = async (values: PasswordFormValues) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password updated successfully!");
        setPasswordModal(false);
        passwordValidation.resetForm();

        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError(data.message || "Error changing password");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError("Error changing password");
    }
  };

  // Main form validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: userProfile?.first_name || "",
      last_name: userProfile?.last_name || "",
      username: userProfile?.username || "",
      company_name: userProfile?.company_name || "",
      company_email: userProfile?.company_email || "",
      company_phone: userProfile?.company_phone || "",
      company_gsm: userProfile?.company_gsm || "", // Added GSM field
      company_address: userProfile?.company_address || "",
      company_city: userProfile?.company_city || "",
      company_tax_id: userProfile?.company_tax_id || "", // Add this line

      company_website: userProfile?.company_website || "",
      company_logo: null,
    } as FormValues,
    validationSchema: Yup.object({
      company_name: Yup.string().required("Company name is required"),
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      username: Yup.string().required("Username is required"),
      company_email: Yup.string()
        .email("Invalid email format")
        .required("Company email is required"),
      company_phone: Yup.string().required("Company phone is required"),
      company_gsm: Yup.string(), // GSM is optional
    }),
    onSubmit: (values: FormValues) => {
      console.log("Submitting form values:", values);
      updateProfile(values);
    },
  });

  // Password form validation
  const passwordValidation = useFormik({
    enableReinitialize: false,
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as PasswordFormValues,
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Current password is required"),
      newPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("New password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Please confirm your password"),
    }),
    onSubmit: (values: PasswordFormValues) => {
      changePassword(values);
    },
  });

  // Show error if no user profile
  if (!userProfile) {
    return (
      <div className="page-content mt-lg-5">
        <Container fluid>
          <Row>
            <Col lg="12">
              <Alert color="danger">
                No user profile found. Please log in again.
              </Alert>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  document.title = "Profile | Velzon - React Admin & Dashboard Template";

  return (
    <React.Fragment>
      <div className="page-content mt-lg-5">
        <Container fluid>
          <Row>
            <Col lg="12">
              {error && <Alert color="danger">{error}</Alert>}
              {success && <Alert color="success">{success}</Alert>}
            </Col>
          </Row>

          <Row>
            <Col lg="12">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Company Profile</h4>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                    encType="multipart/form-data"
                  >
                    <Row>
                      <Col lg="6">
                        <h5>Company Information</h5>
                        <div className="form-group mb-3">
                          <Label className="form-label">Company Name *</Label>
                          <Input
                            name="company_name"
                            className="form-control"
                            placeholder="Enter Company Name"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_name}
                            invalid={
                              validation.touched.company_name &&
                              validation.errors.company_name
                                ? true
                                : false
                            }
                          />
                          {validation.touched.company_name &&
                            validation.errors.company_name && (
                              <FormFeedback type="invalid">
                                {validation.errors.company_name}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company Email *</Label>
                          <Input
                            name="company_email"
                            className="form-control"
                            placeholder="Enter Company Email"
                            type="email"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_email}
                            invalid={
                              validation.touched.company_email &&
                              validation.errors.company_email
                                ? true
                                : false
                            }
                          />
                          {validation.touched.company_email &&
                            validation.errors.company_email && (
                              <FormFeedback type="invalid">
                                {validation.errors.company_email}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company Phone *</Label>
                          <Input
                            name="company_phone"
                            className="form-control"
                            placeholder="Enter Company Phone"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_phone}
                            invalid={
                              validation.touched.company_phone &&
                              validation.errors.company_phone
                                ? true
                                : false
                            }
                          />
                          {validation.touched.company_phone &&
                            validation.errors.company_phone && (
                              <FormFeedback type="invalid">
                                {validation.errors.company_phone}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company GSM</Label>
                          <Input
                            name="company_gsm"
                            className="form-control"
                            placeholder="Enter Company GSM/Mobile"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_gsm}
                          />
                          <small className="text-muted">
                            Optional mobile number for SMS notifications
                          </small>
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company Address</Label>
                          <Input
                            name="company_address"
                            className="form-control"
                            placeholder="Enter Company Address"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_address}
                          />
                        </div>
                        {/* Add these fields in the Company Information section */}
                        <div className="form-group mb-3">
                          <Label className="form-label">Matricule Fiscal</Label>
                          <Input
                            name="company_tax_id"
                            className="form-control"
                            placeholder="Enter Tax ID"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_tax_id}
                          />
                          <small className="text-muted">
                            Company tax identification number
                          </small>
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company City</Label>
                          <Input
                            name="company_city"
                            className="form-control"
                            placeholder="Enter Company City"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_city}
                          />
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company Website</Label>
                          <Input
                            name="company_website"
                            className="form-control"
                            placeholder="Enter Company Website"
                            type="url"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.company_website}
                          />
                        </div>
                      </Col>

                      <Col lg="6">
                        <h5>User Information</h5>
                        <div className="form-group mb-3">
                          <Label className="form-label">Username *</Label>
                          <Input
                            name="username"
                            className="form-control"
                            placeholder="Enter Username"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.username}
                            invalid={
                              validation.touched.username &&
                              validation.errors.username
                                ? true
                                : false
                            }
                          />
                          {validation.touched.username &&
                            validation.errors.username && (
                              <FormFeedback type="invalid">
                                {validation.errors.username}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">First Name *</Label>
                          <Input
                            name="first_name"
                            className="form-control"
                            placeholder="Enter First Name"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.first_name}
                            invalid={
                              validation.touched.first_name &&
                              validation.errors.first_name
                                ? true
                                : false
                            }
                          />
                          {validation.touched.first_name &&
                            validation.errors.first_name && (
                              <FormFeedback type="invalid">
                                {validation.errors.first_name}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Last Name *</Label>
                          <Input
                            name="last_name"
                            className="form-control"
                            placeholder="Enter Last Name"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.last_name}
                            invalid={
                              validation.touched.last_name &&
                              validation.errors.last_name
                                ? true
                                : false
                            }
                          />
                          {validation.touched.last_name &&
                            validation.errors.last_name && (
                              <FormFeedback type="invalid">
                                {validation.errors.last_name}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="form-group mb-3">
                          <Label className="form-label">Company Logo</Label>
                          <Input
                            innerRef={fileInputRef}
                            name="company_logo"
                            className="form-control"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                          <small className="text-muted">
                            Upload your company logo (Max 5MB, JPG, PNG, GIF)
                          </small>
                        </div>

                        {logoPreview && (
                          <div className="mt-3">
                            <Label className="form-label">Logo Preview</Label>
                            <div>
                              <img
                                src={
                                  logoPreview.startsWith("data:")
                                    ? logoPreview
                                    : `${API_BASE}/uploads/${logoPreview}`
                                }
                                alt="Logo Preview"
                                className="img-thumbnail"
                                style={{
                                  maxWidth: "200px",
                                  maxHeight: "200px",
                                  borderRadius: "0",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>

                    <div className="text-center mt-4">
                      <Button type="submit" color="primary">
                        Update Profile
                      </Button>
                      &nbsp;
                      <Button
                        color="outline-primary"
                        onClick={() => setPasswordModal(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModal}
        toggle={() => setPasswordModal(!passwordModal)}
      >
        <ModalHeader toggle={() => setPasswordModal(false)}>
          Change Password
        </ModalHeader>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            passwordValidation.handleSubmit();
            return false;
          }}
        >
          <ModalBody>
            <div className="form-group mb-3">
              <Label className="form-label">Current Password *</Label>
              <Input
                name="currentPassword"
                className="form-control"
                placeholder="Enter current password"
                type="password"
                onChange={passwordValidation.handleChange}
                onBlur={passwordValidation.handleBlur}
                value={passwordValidation.values.currentPassword}
                invalid={
                  passwordValidation.touched.currentPassword &&
                  passwordValidation.errors.currentPassword
                    ? true
                    : false
                }
              />
              {passwordValidation.touched.currentPassword &&
                passwordValidation.errors.currentPassword && (
                  <FormFeedback type="invalid">
                    {passwordValidation.errors.currentPassword}
                  </FormFeedback>
                )}
            </div>

            <div className="form-group mb-3">
              <Label className="form-label">New Password *</Label>
              <Input
                name="newPassword"
                className="form-control"
                placeholder="Enter new password"
                type="password"
                onChange={passwordValidation.handleChange}
                onBlur={passwordValidation.handleBlur}
                value={passwordValidation.values.newPassword}
                invalid={
                  passwordValidation.touched.newPassword &&
                  passwordValidation.errors.newPassword
                    ? true
                    : false
                }
              />
              {passwordValidation.touched.newPassword &&
                passwordValidation.errors.newPassword && (
                  <FormFeedback type="invalid">
                    {passwordValidation.errors.newPassword}
                  </FormFeedback>
                )}
            </div>

            <div className="form-group mb-3">
              <Label className="form-label">Confirm New Password *</Label>
              <Input
                name="confirmPassword"
                className="form-control"
                placeholder="Confirm new password"
                type="password"
                onChange={passwordValidation.handleChange}
                onBlur={passwordValidation.handleBlur}
                value={passwordValidation.values.confirmPassword}
                invalid={
                  passwordValidation.touched.confirmPassword &&
                  passwordValidation.errors.confirmPassword
                    ? true
                    : false
                }
              />
              {passwordValidation.touched.confirmPassword &&
                passwordValidation.errors.confirmPassword && (
                  <FormFeedback type="invalid">
                    {passwordValidation.errors.confirmPassword}
                  </FormFeedback>
                )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              color="secondary"
              onClick={() => setPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" color="primary">
              Change Password
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default UserProfile;
