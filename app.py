# app.py (CORRECTED CODE)
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# --- NEW: Import db from extensions.py ---
from extensions import db 

# Load environment variables
load_dotenv()

# --- Initialization & Configuration ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- Attach the database object to the app ---
db.init_app(app)

# NOW we can safely import models (The circular import is broken)
from models import Company, User 
from services.currency_service import get_currency_for_country

# --- Rest of your routes remain the same ---
@app.route('/api/signup', methods=['POST'])
def initial_signup():
    # ... (Your existing code for initial_signup remains here) ...
    # (No changes needed inside this function)
    if Company.query.first():
        return jsonify({"message": "System is already set up. Please log in."}), 403

    # ... (rest of the function) ...
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    company_name = data.get('company_name')
    country = data.get('country', 'India') 

    if not all([email, password, full_name, company_name, password]):
        return jsonify({"message": "Missing required fields."}), 400

    try:
        currency_code = get_currency_for_country(country)
        
        new_company = Company(name=company_name, currency_code=currency_code)
        db.session.add(new_company)
        db.session.flush()

        new_admin = User(
            email=email,
            full_name=full_name,
            role='Admin', 
            company_id=new_company.id,
            manager_id=None
        )
        new_admin.set_password(password)
        db.session.add(new_admin)
        
        db.session.commit()

        return jsonify({
            "message": "Company and Admin user successfully created.",
            "company_name": new_company.name,
            "company_currency": new_company.currency_code
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error during initial sign-up: {e}")
        return jsonify({"message": "An error occurred during setup. Check server logs."}), 500
    
@app.route('/api/login', methods=['POST'])
def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
    
        if not all([email, password]):
            return jsonify({"message": "Email and password are required."}), 400
    
        user = User.query.filter_by(email=email).first()
    
        # Check if user exists OR if the provided password matches the stored hash
        if user is None or not user.check_password(password):
            return jsonify({"message": "Invalid email or password."}), 401
    
        # Returns basic user info and role upon successful login
        return jsonify({
            "message": "Login successful.",
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "company_id": user.company_id
        }), 200

@app.route('/api/admin/user', methods=['POST'])
def create_user():
    data = request.get_json()
    
    # Simple authorization check (MUST be replaced by token/session checking later)
    # For testing, we send the role in the body
    requester_role = data.get('requester_role') 
    if requester_role != 'Admin':
        return jsonify({"message": "Permission denied. Admin access required."}), 403

    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    # Admin specifies the role (Manager or Employee)
    role = data.get('role', 'Employee') 
    company_id = data.get('company_id') 

    if not all([email, password, full_name, company_id]):
        return jsonify({"message": "Missing required fields."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User with this email already exists."}), 409

    try:
        new_user = User(
            email=email,
            full_name=full_name,
            role=role,
            company_id=company_id,
            manager_id=None # Relationship defined in the next step
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": f"{role} user created successfully.",
            "user_id": new_user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({"message": "Could not create user."}), 500
@app.route('/api/admin/assign-manager', methods=['PATCH'])
def assign_manager():
    data = request.get_json()
    
    # NOTE: Authorization check (still using requester_role from body for simplicity)
    requester_role = data.get('requester_role') 
    employee_id = data.get('employee_id')
    manager_id = data.get('manager_id') # Can be NULL/None to unassign

    # 1. Authorization Check
    if requester_role != 'Admin':
        return jsonify({"message": "Permission denied. Admin access required."}), 403
    
    # 2. Input Validation
    if not employee_id:
        return jsonify({"message": "Employee ID is required."}), 400

    try:
        employee = User.query.get(employee_id)
        if not employee:
            return jsonify({"message": "User to assign manager to not found."}), 404

        # 3. Validation: Check if manager exists and has a valid role
        if manager_id is not None:
            manager = User.query.get(manager_id)
            if not manager or manager.role not in ['Admin', 'Manager']:
                return jsonify({"message": "Invalid Manager ID or user lacks manager role."}), 400
            
            # 4. Validation: Prevent setting self as manager
            if manager_id == employee_id:
                 return jsonify({"message": "Cannot assign employee as their own manager."}), 400
        
        # 5. Update Relationship
        employee.manager_id = manager_id
        db.session.commit()

        return jsonify({
            "message": f"Manager assigned successfully for user ID {employee_id}.",
            "new_manager_id": manager_id
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error assigning manager: {e}")
        return jsonify({"message": "An error occurred during manager assignment."}), 500


# --- Server Start and Database Setup ---
if __name__ == '__main__':
    with app.app_context():
        # This will now successfully create your tables!
        db.create_all() 
    app.run(debug=True)