from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ChannelMessage:
    source_ref: str
    text: str
    customer_id: str
    raw_payload: dict = field(default_factory=dict)
    attachments: list = field(default_factory=list)


class BaseChannel(ABC):
    name: str
    display_name: str
    supports_inbound: bool = True
    supports_outbound: bool = True
    inbound_method: str = "polling"
    enabled: bool = False

    @abstractmethod
    async def start(self) -> None:
        ...

    @abstractmethod
    async def stop(self) -> None:
        ...

    @abstractmethod
    async def send_message(self, source_ref: str, text: str, **kwargs) -> bool:
        ...

    @abstractmethod
    def is_configured(self) -> bool:
        ...