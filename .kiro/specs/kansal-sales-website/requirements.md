# Requirements Document

## Introduction

Kansal Sales is a grocery and milk products business that needs a full website to showcase products, allow users to browse and manage a cart, handle user accounts, and provide an admin panel for product management. The website will also include a contact page with a Telegram community link. A payment/purchase page is planned as a future phase and is noted here for forward compatibility.

## Glossary

- **Website**: The Kansal Sales web application accessible via browser
- **User**: A registered and authenticated customer of Kansal Sales
- **Guest**: An unauthenticated visitor browsing the website
- **Admin**: An authorized administrator who manages products and website content
- **Product**: A grocery or milk product listed for sale on the website
- **Category**: A grouping of related products (e.g., Dairy, Grains, Beverages)
- **Cart**: A temporary collection of products a User or Guest has selected
- **Auth_Service**: The system component responsible for user authentication and session management
- **Product_Service**: The system component responsible for product and category data management
- **Cart_Service**: The system component responsible for cart state management and persistence
- **Admin_Panel**: The restricted interface through which the Admin manages products and content
- **Contact_Form**: The UI component that collects user inquiries and displays the Telegram channel link
- **Confirmation_Dialog**: A UI prompt requiring explicit Admin approval before a destructive or modifying action is committed

---

## Requirements

### Requirement 1: Public Navigation and Page Structure

**User Story:** As a Guest or User, I want to navigate between Home, Products, and Categories pages, so that I can explore the website easily.

#### Acceptance Criteria

1. THE Website SHALL provide a navigation bar accessible on all pages containing links to Home, Products, Categories, Cart, and Login.
2. WHEN a Guest or User clicks a navigation link, THE Website SHALL render the corresponding page without a full page reload.
3. THE Website SHALL display a Home page that introduces Kansal Sales with a banner, a brief description, and featured products.
4. THE Website SHALL display a Products page that lists all available products with name, image, price, and category.
5. THE Website SHALL display a Categories page that lists all product categories and allows filtering products by category.

---

### Requirement 2: User Registration and Login

**User Story:** As a visitor, I want to register and log in to my account, so that I can save my cart and preferences across sessions.

#### Acceptance Criteria

1. THE Website SHALL provide a registration form accepting a unique email address, a display name, and a password of at least 8 characters.
2. WHEN a visitor submits valid registration details, THE Auth_Service SHALL create a new User account and send a verification email.
3. WHEN a visitor submits a registration form with an already-registered email, THE Auth_Service SHALL return an error message indicating the email is already in use.
4. THE Website SHALL provide a login form accepting an email address and password.
5. WHEN a User submits valid login credentials, THE Auth_Service SHALL issue a session token and redirect the User to the Home page.
6. WHEN a User submits invalid login credentials, THE Auth_Service SHALL return an error message and SHALL NOT issue a session token.
7. WHEN a User is authenticated, THE Website SHALL display the User's display name in the navigation bar and replace the Login link with a Logout option.
8. WHEN a User clicks Logout, THE Auth_Service SHALL invalidate the session token and redirect the User to the Home page.
9. THE Auth_Service SHALL store passwords as salted cryptographic hashes and SHALL NOT store plaintext passwords.

---

### Requirement 3: Product Browsing and Search

**User Story:** As a Guest or User, I want to browse and search for grocery and milk products, so that I can find what I need quickly.

#### Acceptance Criteria

1. THE Product_Service SHALL maintain a catalog of products each containing: name, description, price, stock status, category, and at least one image.
2. WHEN a Guest or User visits the Products page, THE Website SHALL display all in-stock and out-of-stock products with their stock status clearly indicated.
3. WHEN a Guest or User selects a category from the Categories page, THE Website SHALL display only products belonging to that category.
4. WHEN a Guest or User enters a search term in the search bar, THE Website SHALL display products whose name or description contains the search term.
5. IF no products match a search or filter, THEN THE Website SHALL display a "No products found" message.

---

### Requirement 4: Shopping Cart

**User Story:** As a User, I want to add products to a cart and save my selections, so that I can review my choices before purchasing.

#### Acceptance Criteria

1. WHEN a User clicks "Add to Cart" on a product, THE Cart_Service SHALL add that product to the User's cart and persist the cart to the backend.
2. WHEN a User updates the quantity of a cart item, THE Cart_Service SHALL update the stored quantity and recalculate the cart total.
3. WHEN a User removes an item from the cart, THE Cart_Service SHALL remove that item and update the cart total.
4. WHEN an authenticated User logs in, THE Cart_Service SHALL restore the User's previously saved cart from the backend.
5. WHILE a User is logged in, THE Cart_Service SHALL synchronize cart changes to the backend within 2 seconds of each change.
6. THE Website SHALL display the current cart item count in the navigation bar at all times.
7. WHEN a Guest adds items to the cart, THE Cart_Service SHALL store the cart in the browser session and SHALL prompt the Guest to log in to save progress permanently.

---

### Requirement 5: Admin Panel — Product Management

**User Story:** As an Admin, I want to add, edit, and remove products through a secure panel, so that I can keep the product catalog up to date.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible only to authenticated users with the Admin role.
2. WHEN an unauthenticated user or a non-Admin User attempts to access the Admin_Panel URL, THE Website SHALL redirect them to the Home page and display an "Access Denied" message.
3. THE Admin_Panel SHALL provide a form to add a new product with fields for name, description, price, category, stock status, and at least one image.
4. WHEN an Admin submits a valid new product form, THE Product_Service SHALL create the product and make it visible on the Products page.
5. THE Admin_Panel SHALL allow the Admin to edit any existing product's name, description, price, category, stock status, or image.
6. WHEN an Admin submits an edit to a product, THE Website SHALL display a Confirmation_Dialog summarizing the changes before committing them.
7. WHEN the Admin confirms the Confirmation_Dialog, THE Product_Service SHALL apply the changes and update the product on the Products page.
8. WHEN the Admin cancels the Confirmation_Dialog, THE Product_Service SHALL discard the pending changes and leave the product unchanged.
9. THE Admin_Panel SHALL allow the Admin to delete a product.
10. WHEN an Admin initiates a product deletion, THE Website SHALL display a Confirmation_Dialog asking the Admin to confirm the deletion before it is executed.
11. WHEN the Admin confirms deletion, THE Product_Service SHALL remove the product from the catalog and it SHALL no longer appear on the Products page.
12. THE Admin_Panel SHALL allow the Admin to create, rename, and delete product categories.

---

### Requirement 6: Contact Form and Telegram Channel

**User Story:** As a Guest or User, I want to contact Kansal Sales and join their community, so that I can get support and stay updated.

#### Acceptance Criteria

1. THE Website SHALL provide a Contact page accessible from the navigation bar.
2. THE Contact_Form SHALL include fields for the sender's name, email address, and message.
3. WHEN a Guest or User submits a valid Contact_Form, THE Website SHALL send the message to the Kansal Sales admin email and display a success confirmation to the sender.
4. IF a Contact_Form is submitted with an empty required field, THEN THE Website SHALL display a validation error for each empty field and SHALL NOT submit the form.
5. THE Contact page SHALL display a clearly visible link to the Kansal Sales Telegram channel at https://t.me/+CTrROqUmKkM4MTJl with a label inviting users to join the community.
6. WHEN a Guest or User clicks the Telegram link, THE Website SHALL open the link in a new browser tab.

---

### Requirement 7: Security

**User Story:** As a business owner, I want the website to be secure, so that customer data and admin controls are protected.

#### Acceptance Criteria

1. THE Website SHALL enforce HTTPS for all pages and API endpoints.
2. THE Auth_Service SHALL invalidate session tokens after 24 hours of inactivity.
3. THE Website SHALL sanitize all user-supplied input before storing or rendering it to prevent cross-site scripting (XSS) attacks.
4. THE Website SHALL use parameterized queries or an ORM for all database interactions to prevent SQL injection.
5. THE Admin_Panel SHALL enforce role-based access control, ensuring only users with the Admin role can access admin routes.
6. THE Auth_Service SHALL rate-limit login attempts to a maximum of 10 attempts per IP address per 15-minute window.
7. IF a login attempt exceeds the rate limit, THEN THE Auth_Service SHALL block further attempts from that IP for 15 minutes and return an appropriate error message.

---

### Requirement 8: Future Payment Gateway (Forward Compatibility)

**User Story:** As a business owner, I want the website architecture to support a future payment page, so that purchasing can be added without a full redesign.

#### Acceptance Criteria

1. THE Cart_Service SHALL expose a checkout initiation endpoint that accepts a cart ID and returns an order summary, ready to be consumed by a future payment gateway integration.
2. THE Website SHALL reserve a `/checkout` route that displays an "Coming Soon" placeholder until the payment gateway is integrated.
3. THE Product_Service SHALL maintain a price field on each product that is compatible with standard payment gateway amount formats (decimal, two decimal places).
