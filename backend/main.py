from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from database import engine, get_db, Base
from models import Video
from schemas import VideoCreate, VideoResponse, VideoInfo
from crud import get_video, get_all_videos, create_video, increment_views
import traceback
import uvicorn

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ifbest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Ifbest API работает!"}

@app.get("/api/videos", response_model=list[VideoResponse])
def list_videos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_all_videos(db, skip, limit)

@app.get("/api/video-info/{video_id}")
def video_info(video_id: int, db: Session = Depends(get_db)):
    """Получить инфо о видео по ID"""
    try:
        video = get_video(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        date_str = format_date(video.created_at)
        
        return {
            "id": video.id,
            "title": video.title or "Без названия",
            "views": video.views or 0,
            "channel": video.channel_name or "Неизвестный канал",
            "date": date_str,
            "video_url": video.video_url or ""
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ОШИБКА в video_info({video_id}):")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/api/video/{video_id}/view")
def add_view(video_id: int, db: Session = Depends(get_db)):
    try:
        video = increment_views(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"views": video.views}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ОШИБКА в add_view({video_id}):")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/api/videos", response_model=VideoResponse)
def add_video(video: VideoCreate, db: Session = Depends(get_db)):
    return create_video(db, video)

def format_date(dt) -> str:
    try:
        if dt is None:
            return "недавно"
        
        now = datetime.now()
        
        if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        
        if hasattr(now, 'tzinfo') and now.tzinfo is not None:
            now = now.replace(tzinfo=None)
        
        diff = now - dt
        seconds = diff.total_seconds()
        
        if seconds < 0:
            return "только что"
        if seconds < 60:
            return "только что"
        if seconds < 3600:
            return f"{int(seconds/60)} мин. назад"
        if seconds < 86400:
            return f"{int(seconds/3600)} ч. назад"
        if seconds < 2592000:
            return f"{int(seconds/86400)} дн. назад"
        if seconds < 31536000:
            return f"{int(seconds/2592000)} мес. назад"
        return f"{int(seconds/31536000)} год(а) назад"
    except Exception as e:
        print(f"Ошибка в format_date: {e}")
        return "недавно"

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
