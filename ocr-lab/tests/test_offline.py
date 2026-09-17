import socket

import pytest

from bom_ocr.offline import network_disabled


def test_inference_guard_blocks_network_and_restores_socket_api():
    original = socket.create_connection
    with network_disabled():
        with pytest.raises(OSError, match="disabled"):
            socket.create_connection(("example.com", 443))
        with pytest.raises(OSError, match="disabled"):
            socket.getaddrinfo("example.com", 443)
    assert socket.create_connection is original
