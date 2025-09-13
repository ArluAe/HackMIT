import math

class Branch:
    def __init__(self, node0, node1, capacity, transmission_factor=1.0):
        self.node0 = node0
        self.node1 = node1
        self.capacity = capacity
        self.transmission_factor = transmission_factor

    def get_transmission(self):
        offset0 = self.node0.offset
        offset1 = self.node1.offset

        transmission = self.transmission_factor * math.sin(offset1 - offset0)
        return max(-self.capacity, min(transmission, self.capacity)) # Clamp to capacity

    def __str__(self):
        return f"Branch({self.node0}, {self.node1}, capacity={self.capacity})"