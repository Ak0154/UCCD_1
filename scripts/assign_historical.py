import logging
from api.db.session import get_db
from api.models.complaint import Complaint
from services.agent_service import auto_assign_complaint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("assign_historical")

def main():
    db = next(get_db())
    # Query all complaints where assigned_to is None
    unassigned_complaints = (
        db.query(Complaint)
        .filter(Complaint.assigned_to.is_(None))
        .all()
    )
    logger.info(f"Found {len(unassigned_complaints)} unassigned complaints.")
    
    assigned_count = 0
    for complaint in unassigned_complaints:
        # Run the auto_assign_complaint function
        agent = auto_assign_complaint(db, str(complaint.id), complaint.complaint_type)
        if agent:
            assigned_count += 1
            logger.info(f"Assigned complaint {complaint.id} ({complaint.complaint_type}) to {agent}")
        else:
            logger.warning(f"Failed to assign complaint {complaint.id}")
            
    logger.info(f"Successfully assigned {assigned_count} historical complaints.")

if __name__ == "__main__":
    main()
