
from environment.PowerGrid import PowerGrid
from cases import case14

my_grid = PowerGrid(case14(), 0.01)
my_grid.simulate_day()
