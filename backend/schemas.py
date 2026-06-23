from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VideoBase(BaseModel):
    title: str
    video_url: str
    channel_name: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class VideoResponse(VideoBase):
    id: int
    views: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class VideoInfo(BaseModel):
    id: int
    title: str
    views: int
    channel: str
    date: str
    video_url: str