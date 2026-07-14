import os
import csv
import random
from datetime import datetime, timedelta

def generate_data():
    os.makedirs("sample_data", exist_ok=True)
    
    # Products catalog
    categories = {
        "Electronics": ["Smartphone", "Laptop", "Bluetooth Speaker", "Smart Watch", "Power Bank"],
        "Apparel": ["Cotton T-Shirt", "Denim Jeans", "Running Shoes", "Leather Jacket", "Socks Pack"],
        "Home & Kitchen": ["Air Fryer", "Blender", "Coffee Mug", "Non-Stick Pan", "Bed Sheets"],
        "Books": ["Coding AI Agents", "Business Strategy", "Financial Freedom", "Storybook", "Cooking Guide"]
    }
    
    # Costs and Prices for products
    product_meta = {}
    for cat, items in categories.items():
        for name in items:
            price = random.randint(15, 120) * 10
            if name == "Smartphone": price = 15000
            elif name == "Laptop": price = 45000
            elif name == "Coding AI Agents": price = 800
            cost = int(price * random.uniform(0.5, 0.7))
            product_meta[name] = {"category": cat, "price": price, "cost": cost}

    # 1. Generate sales_jan_march.csv
    print("Generating sales_jan_march.csv...")
    sales_file = "sample_data/sales_jan_march.csv"
    cities = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Kolkata", "Hyderabad"]
    
    sales_rows = []
    start_date = datetime(2024, 1, 1)
    
    for i in range(300):
        # Determine date
        days_offset = random.randint(0, 90)
        date_obj = start_date + timedelta(days=days_offset)
        date_str = date_obj.strftime("%Y-%m-%d")
        month = date_obj.month
        
        # Pick product
        product_name = random.choice(list(product_meta.keys()))
        meta = product_meta[product_name]
        
        # Units sold
        units = random.randint(1, 10)
        
        # Planted pattern: February revenue drops 25%
        if month == 2:
            units = max(1, int(units * 0.75))
            
        revenue = units * meta["price"]
        city = random.choice(cities)
        
        # Planted pattern: Chennai has higher purchase velocity/volume
        if city == "Chennai" and random.random() > 0.4:
            units += random.randint(2, 5)
            revenue = units * meta["price"]
            
        sales_rows.append([date_str, product_name, meta["category"], units, revenue, city])
        
    # Sort sales rows by date
    sales_rows.sort(key=lambda x: x[0])
    
    with open(sales_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "product_name", "category", "units_sold", "revenue", "city"])
        writer.writerows(sales_rows)

    # 2. Generate expenses_jan_march.csv
    print("Generating expenses_jan_march.csv...")
    expenses_file = "sample_data/expenses_jan_march.csv"
    vendors = ["Logistics India", "Web Hosting Service", "Local Rent Inc", "Office Supply Corp", "Tax Consultant", "Digital Ad Agency"]
    payment_modes = ["UPI", "Net Banking", "Credit Card", "Cash"]
    expense_cats = ["Rent", "Marketing", "Logistics", "Office Supplies", "Software SaaS", "Professional Fees"]
    
    expenses_rows = []
    for i in range(150):
        days_offset = random.randint(0, 90)
        date_obj = start_date + timedelta(days=days_offset)
        date_str = date_obj.strftime("%Y-%m-%d")
        month = date_obj.month
        
        exp_cat = random.choice(expense_cats)
        vendor = random.choice(vendors)
        pay_mode = random.choice(payment_modes)
        
        amount = random.randint(500, 8000)
        
        # Planted pattern: February expenses are HIGHEST month
        if month == 2:
            amount = int(amount * 1.6) # 60% boost in expenses
            if exp_cat == "Marketing":
                amount += 8000 # Added ad spend
                
        expenses_rows.append([date_str, exp_cat, amount, vendor, pay_mode])
        
    expenses_rows.sort(key=lambda x: x[0])
    
    with open(expenses_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "category", "amount", "vendor", "payment_mode"])
        writer.writerows(expenses_rows)

    # 3. Generate inventory.csv
    print("Generating inventory.csv...")
    inventory_file = "sample_data/inventory.csv"
    
    # 8 products are below reorder level (especially top sellers like Smartphone, Laptop, Coding AI Agents)
    low_stock_items = ["Smartphone", "Laptop", "Coding AI Agents", "Cotton T-Shirt", "Bed Sheets", "Air Fryer", "Coffee Mug", "Running Shoes"]
    
    inventory_rows = []
    for name, meta in product_meta.items():
        reorder_level = random.randint(10, 30)
        
        if name in low_stock_items:
            current_stock = random.randint(1, reorder_level - 1)
        else:
            current_stock = random.randint(reorder_level + 5, reorder_level + 50)
            
        last_restocked = (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d")
        inventory_rows.append([name, meta["category"], current_stock, reorder_level, last_restocked])
        
    with open(inventory_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["product_name", "category", "current_stock", "reorder_level", "last_restocked"])
        writer.writerows(inventory_rows)

    # 4. Generate customers.csv
    print("Generating customers.csv...")
    customers_file = "sample_data/customers.csv"
    names = [
        "Aarav Sharma", "Aditya Patel", "Amit Kumar", "Ananya Iyer", "Arjun Reddy",
        "Deepak Gupta", "Divya Nair", "Ganesh Murthy", "Ishita Sen", "Karan Johar",
        "Meera Krishnan", "Neha Verma", "Pranav Rao", "Rahul Dravid", "Rohan Mehta",
        "Siddharth Roy", "Sneha Patil", "Vikram Singh", "Yash Birla", "Priya Nair",
        "Ramesh Kumar", "Suresh Balan", "Karthik Raja", "Vijay Anand", "Manoj Das"
    ]
    
    customers_rows = []
    # 40% of customers made only 1 purchase and never returned
    # Chennai customers have high purchase velocity/repeat
    for i in range(100):
        c_id = f"CUST_{1000 + i}"
        name = random.choice(names) + f" {chr(random.randint(65, 90))}."
        city = random.choice(cities)
        
        if city == "Chennai":
            # Chennai repeat rate is high
            total_orders = random.randint(4, 12)
            signup_date = datetime(2023, random.randint(1, 6), random.randint(1, 28))
            last_date = signup_date + timedelta(days=random.randint(100, 200))
        elif random.random() < 0.4:
            # 40% only 1 order and never returned
            total_orders = 1
            signup_date = datetime(2023, random.randint(1, 10), random.randint(1, 28))
            last_date = signup_date
        else:
            total_orders = random.randint(2, 5)
            signup_date = datetime(2023, random.randint(1, 6), random.randint(1, 28))
            last_date = signup_date + timedelta(days=random.randint(30, 90))
            
        signup_str = signup_date.strftime("%Y-%m-%d")
        last_str = last_date.strftime("%Y-%m-%d")
        
        customers_rows.append([c_id, name, city, signup_str, total_orders, last_str])
        
    with open(customers_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["customer_id", "name", "city", "first_purchase_date", "total_orders", "last_purchase_date"])
        writer.writerows(customers_rows)
        
    print("All sample data files successfully generated.")

if __name__ == "__main__":
    generate_data()
