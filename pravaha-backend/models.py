# models.py
from extensions import db 
from werkzeug.security import generate_password_hash, check_password_hash

# --- Company Model ---
class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    
    users = db.relationship('User', backref='company', lazy=True)

# --- User Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    # FIX: Increased size from 128 to 256 to prevent StringDataRightTruncation error
    password_hash = db.Column(db.String(256)) 
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='Employee', nullable=False) 
    
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) 
    
    team_members = db.relationship('User', backref=db.backref('manager', remote_side=[id]), lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Expense Details
    amount = db.Column(db.Numeric(10, 2), nullable=False) # Submitted amount
    currency = db.Column(db.String(3), nullable=False)    # Submitted currency (e.g., USD, EUR)
    
    # Converted Amount (Crucial for company financials)
    base_amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    date = db.Column(db.Date, nullable=False)
    
    # Status and Approval Flow
    status = db.Column(db.String(20), default='Pending', nullable=False) # Pending, Approved, Rejected
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)

    # Relationships (Optional but good practice)
    user = db.relationship('User', backref='expenses')
    company = db.relationship('Company', backref='company_expenses')