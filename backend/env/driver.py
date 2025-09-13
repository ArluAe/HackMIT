from PowerGrid import PowerGrid
import case14
my_grid = PowerGrid(case14.case14(), 0.01)
my_grid.simulate_day()