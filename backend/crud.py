from sqlalchemy.orm import Session
from models import Video
from schemas import VideoCreate

def get_video(db: Session, video_id: int):
    return db.query(Video).filter(Video.id == video_id, Video.status == "active").first()

def get_all_videos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Video).filter(Video.status == "active").offset(skip).limit(limit).all()

def create_video(db: Session, video: VideoCreate):
    db_video = Video(**video.dict())
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

def increment_views(db: Session, video_id: int):
    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.views += 1
        db.commit()
        db.refresh(video)
    return video
