import sys
import os
import time
from uuid import uuid4
from datetime import datetime, timezone, timedelta

# Add workspace to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db.session import engine, Base, get_db
from api.models.complaint import Complaint
from agents.orchestrator import run_pipeline

# Sample customer complaints data
MOCK_COMPLAINTS = [
    {
        "customer_id": "CUST_1001",
        "channel": "WhatsApp",
        "raw_text": "Tried to pay Rs. 1500 using GPay UPI to my milkman. The payment failed but my account got debited. It is showing 'processing' on my bank statement. Please refund immediately.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1002",
        "channel": "Email",
        "raw_text": "My father tried to withdraw Rs. 20000 from the ATM in Bangalore. The money did not come out, but his phone got SMS that it was debited. He is an old senior citizen and this is his pension. Please help.",
        "vip_customer": True,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1003",
        "channel": "Web",
        "raw_text": "I submitted all documents for my home loan (ref: HL-908231) at the Delhi Branch 4 weeks ago. The manager keeps saying 'sent for approval'. I have to pay the builder by next week or I will lose my booking. Very bad service.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1004",
        "channel": "Telegram",
        "raw_text": "Help! I got an SMS saying my credit card has been charged for USD 500 on some international website. I did not do this transaction! I did not share any OTP. Block my card immediately and cancel this transaction!",
        "vip_customer": True,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1005",
        "channel": "PlayStore",
        "raw_text": "Your Vyom mobile app is not working. Whenever I try to login to check my balance, it shows 'Server busy, try again later' or error code connection timed out. Please fix your app.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1006",
        "channel": "Email",
        "raw_text": "I bought a train ticket on IRCTC for Rs. 3500 and paid via my credit card. The portal failed, so I did it again. Now I see two entries of Rs. 3500 on my credit card statement! Refund the duplicate charge.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1007",
        "channel": "Web",
        "raw_text": "Went to your Bandra branch to update my KYC. The counter clerk was extremely rude and made me stand in queue for 2 hours, then told me to come back tomorrow because the server is down. This is unacceptable behavior.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1008",
        "channel": "WhatsApp",
        "raw_text": "I closed my gold loan account (GL-5512) and paid the entire outstanding amount last Monday. Yet the branch is refusing to return my gold ornaments, saying the locker keys are with the regional office. Return my gold now.",
        "vip_customer": True,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1009",
        "channel": "Email",
        "raw_text": "Rs. 450 has been debited from my savings account towards some PMJJBY insurance scheme without my consent! I never signed up for this. This is fraud. Deactivate this and credit back my money.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1010",
        "channel": "Email",
        "raw_text": "I am a retired government employee. My pension account interest for this quarter is calculated incorrectly, it is Rs. 1200 less than what it should be. The branch clerk is not listening. I will complain to the Banking Ombudsman if this is not resolved.",
        "vip_customer": False,
        "regulatory_flag": True
    },
    {
        "customer_id": "CUST_1011",
        "channel": "Telegram",
        "raw_text": "Attempted withdrawal of 5000 Rs at SBI ATM using Union Bank debit card. Machine gave transaction timed out but money cut from my account. Please refund my cash.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1012",
        "channel": "Web",
        "raw_text": "I opened a premium corporate salary account last month. The branch promised zero-balance and free checkbook, but I was charged Rs. 250 for low balance and Rs. 150 for checkbook. Reverse these charges!",
        "vip_customer": True,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1013",
        "channel": "WhatsApp",
        "raw_text": "I requested a new cheque book online through internet banking 15 days ago. I haven't received it yet. The tracking link sent in SMS is invalid. I need it urgently for my business payments.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1014",
        "channel": "Email",
        "raw_text": "My education loan interest subsidy under CSIS scheme has not been credited to my account for the last financial year. My friends in other banks have already received it. Please update the status.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1015",
        "channel": "WhatsApp",
        "raw_text": "Swiped my debit card at D-Mart for Rs. 8400. The receipt showed transaction failed, but my mobile got SMS of debit. Had to pay via cash. Refund the debit card transaction amount immediately.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1016",
        "channel": "Telegram",
        "raw_text": "URGENT: I clicked on a link in an SMS that looked like it was from Union Bank. Now Rs. 40,000 has been transferred from my account to some unknown person. Please freeze the receiver's account and block my net banking!",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1017",
        "channel": "Phone",
        "raw_text": "I've been waiting in your Indiranagar branch queue for over 3 hours just to update my nominee in my savings account. There are only two counters open out of eight. The staff are moving very slowly. This is terrible service.",
        "vip_customer": False,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1018",
        "channel": "Email",
        "raw_text": "I have a car loan EMI due on the 1st of every month. My salary was delayed this month and the EMI bounced. Now the bank recovery agents are calling my family and neighbours, using threatening language. This is harassment and a violation of RBI fair practices code. Stop this immediately.",
        "vip_customer": False,
        "regulatory_flag": True
    },
    {
        "customer_id": "CUST_1019",
        "channel": "Web",
        "raw_text": "I received my mutual fund redemption of Rs. 1,25,000 into my savings account on 20th May, but the amount is still 'on hold' and not credited to my available balance. I need these funds urgently for my daughter's college admission fee due tomorrow.",
        "vip_customer": True,
        "regulatory_flag": False
    },
    {
        "customer_id": "CUST_1020",
        "channel": "WhatsApp",
        "raw_text": "My father passed away last month. I submitted the death certificate and claim forms for his fixed deposit at the Pune branch 20 days ago. No update yet. The branch manager keeps saying 'it's under process'. We are the legal nominees. Please expedite this.",
        "vip_customer": False,
        "regulatory_flag": True
    }
]

def seed_database():
    print("Verifying database tables...")
    Base.metadata.create_all(bind=engine)
    
    # 1. Clear existing complaints using a short-lived session
    db = next(get_db())
    print("Clearing existing complaints to start fresh...")
    try:
        db.query(Complaint).delete()
        db.commit()
        print("Existing complaints deleted.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing table: {e}")
    finally:
        db.close()
        
    print(f"Starting seed process for {len(MOCK_COMPLAINTS)} complaints...")
    
    for index, data in enumerate(MOCK_COMPLAINTS, start=1):
        complaint_id = uuid4()
        print(f"[{index}/{len(MOCK_COMPLAINTS)}] Ingesting complaint ID {complaint_id} for {data['customer_id']}...")
        
        # 1. Insert base queued complaint using a fresh session
        db = next(get_db())
        try:
            new_complaint = Complaint(
                id=complaint_id,
                customer_id=data["customer_id"],
                channel=data["channel"],
                raw_text=data["raw_text"],
                vip_customer=data["vip_customer"],
                regulatory_flag=data["regulatory_flag"],
                status="queued"
            )
            db.add(new_complaint)
            db.commit()
        except Exception as insert_err:
            db.rollback()
            print(f"   Insert failed: {insert_err}")
            db.close()
            continue
        finally:
            db.close()
            
        # 2. Run AI pipeline
        print(f"   Running AI pipeline for {complaint_id}...")
        try:
            run_pipeline(
                complaint_id=str(complaint_id),
                raw_text=data["raw_text"],
                channel=data["channel"],
                customer_id=data["customer_id"]
            )
            
            # Fetch and print result using a fresh session
            db = next(get_db())
            try:
                c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
                if c is not None:
                    print(f"   Success: type={c.complaint_type}, severity={c.severity_score}, sla_tier={c.sla_tier}, cluster={c.cluster_id}, pre_escalate={c.pre_escalate}")
                else:
                    print(f"   Warning: Complaint ID {complaint_id} was not found in database after pipeline execution.")
            finally:
                db.close()
        except Exception as e:
            print(f"   Error running pipeline: {e}")
            
        # Sleep slightly to stay clean
        time.sleep(1)
        
    print("\nDatabase Seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
