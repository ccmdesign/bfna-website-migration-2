# Atlas Test Spec Format

**Purpose**: Detailed specification for Atlas test spec JSON format

## Test Spec Structure

```json
{
  "name": "Task ID + description",
  "taskId": "T042",
  "url": "http://localhost:3000/path/to/test",
  "type": "visual|ui|ux",
  "description": "What this test validates",
  "checks": [
    {
      "type": "element-exists|interaction|visual-regression|accessibility|navigation",
      "selector": "CSS selector or data-testid",
      "description": "What to verify",
      "action": "click|type|hover|keyboard|scroll",
      "expect": {
        "url-change": "optional expected URL",
        "element-visible": "optional selector",
        "console-errors": 0
      }
    }
  ],
  "baseline": "scripts/atlas/baselines/{task-id}.png",
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

## Field Definitions

### Top-Level Fields

- **`name`** (string, required): Human-readable test name, typically "Task ID + description"
- **`taskId`** (string, required): Task ID from tasks.md (e.g., "T042")
- **`url`** (string, required): Full URL to test (typically `http://localhost:3000/...`)
- **`type`** (string, required): Test type - `"visual"`, `"ui"`, or `"ux"`
- **`description`** (string, optional): Detailed description of what the test validates
- **`baseline`** (string, optional): Path to baseline screenshot for visual regression tests
- **`viewport`** (object, optional): Browser viewport dimensions
  - `width` (number): Viewport width in pixels (default: 1920)
  - `height` (number): Viewport height in pixels (default: 1080)

### Check Types

#### `element-exists`

Verify an element exists and is visible on the page.

```json
{
  "type": "element-exists",
  "selector": "[data-testid='search-results']",
  "description": "Search results container is visible"
}
```

#### `interaction`

Perform an interaction and verify expected outcomes.

```json
{
  "type": "interaction",
  "selector": "[data-testid='search-input']",
  "action": "type",
  "value": "test query",
  "description": "Type search query and verify results appear",
  "expect": {
    "element-visible": "[data-testid='search-results']",
    "console-errors": 0
  }
}
```

**Actions:**
- `click`: Click an element
- `type`: Type text into an input field
- `hover`: Hover over an element
- `keyboard`: Press keyboard keys (specify key in `value` field)
- `scroll`: Scroll to element or position

**Expect fields:**
- `url-change` (string): Expected URL after interaction
- `element-visible` (string): Selector for element that should become visible
- `console-errors` (number): Maximum allowed console errors (0 = no errors)

#### `visual-regression`

Compare screenshot against baseline.

```json
{
  "type": "visual-regression",
  "selector": ".search-results",
  "baseline": "scripts/atlas/baselines/T042.png",
  "threshold": 0.01,
  "description": "Search results layout matches baseline"
}
```

**Fields:**
- `selector` (string): Element to capture (or `"viewport"` for full page)
- `baseline` (string): Path to baseline screenshot
- `threshold` (number, optional): Pixel difference tolerance (0.01 = 1%, default: 0)

#### `accessibility`

Verify accessibility requirements.

```json
{
  "type": "accessibility",
  "selector": "[data-testid='search-button']",
  "checks": ["keyboard-navigation", "focus-indicators", "aria-labels"],
  "description": "Search button is keyboard accessible"
}
```

**Checks:**
- `keyboard-navigation`: Element can be reached via keyboard
- `focus-indicators`: Focus state is visually indicated
- `aria-labels`: ARIA labels are present and correct
- `color-contrast`: Text meets WCAG contrast requirements

#### `navigation`

Multi-step navigation flow (for UX tests).

```json
{
  "type": "navigation",
  "description": "Complete search workflow",
  "steps": [
    {
      "action": "navigate",
      "url": "http://localhost:3000/"
    },
    {
      "action": "type",
      "selector": ".header-search input",
      "value": "democracy"
    },
    {
      "action": "click",
      "selector": ".header-search button"
    },
    {
      "expect": {
        "url-change": "/search?q=democracy",
        "element-visible": ".search-results"
      }
    }
  ]
}
```

## Test Type Guidelines

### Visual Tests (`type: "visual"`)

Use for:
- Screenshot comparison
- Layout verification
- Responsive breakpoint checks
- Visual regression detection

**Example:**
```json
{
  "name": "T042 - Search results visual layout",
  "taskId": "T042",
  "url": "http://localhost:3000/search?q=test",
  "type": "visual",
  "description": "Verify search results page layout matches design",
  "baseline": "scripts/atlas/baselines/T042.png",
  "checks": [
    {
      "type": "visual-regression",
      "selector": "viewport",
      "baseline": "scripts/atlas/baselines/T042.png",
      "threshold": 0.01
    }
  ]
}
```

### UI Tests (`type: "ui"`)

Use for:
- Element interactions (clicks, form inputs)
- Keyboard navigation
- Focus states
- Form validation
- Component state changes

**Example:**
```json
{
  "name": "T043 - Search input interaction",
  "taskId": "T043",
  "url": "http://localhost:3000/search",
  "type": "ui",
  "description": "Verify search input accepts input and displays results",
  "checks": [
    {
      "type": "interaction",
      "selector": "[data-testid='search-input']",
      "action": "type",
      "value": "democracy",
      "expect": {
        "element-visible": "[data-testid='search-results']",
        "console-errors": 0
      }
    },
    {
      "type": "accessibility",
      "selector": "[data-testid='search-input']",
      "checks": ["keyboard-navigation", "focus-indicators"]
    }
  ]
}
```

### UX Tests (`type: "ux"`)

Use for:
- End-to-end user flows
- Multi-step workflows
- Complete user journeys from spec.md acceptance scenarios
- Cross-page navigation

**Example:**
```json
{
  "name": "T044 - Complete search workflow",
  "taskId": "T044",
  "url": "http://localhost:3000/",
  "type": "ux",
  "description": "Verify complete search flow: header search → results → navigation",
  "checks": [
    {
      "type": "navigation",
      "steps": [
        {
          "action": "navigate",
          "url": "http://localhost:3000/"
        },
        {
          "action": "type",
          "selector": ".header-search input",
          "value": "democracy"
        },
        {
          "action": "click",
          "selector": ".header-search button"
        },
        {
          "expect": {
            "url-change": "/search?q=democracy",
            "element-visible": ".search-results"
          }
        },
        {
          "action": "click",
          "selector": ".search-result-card:first-child"
        },
        {
          "expect": {
            "url-change": "/publications/",
            "console-errors": 0
          }
        }
      ]
    }
  ]
}
```

## Result Format

Test execution results follow this structure:

```json
{
  "taskId": "T042",
  "specFile": "scripts/atlas/test-specs/T042.json",
  "executedAt": "2025-01-27T10:30:00Z",
  "status": "pass|fail|error",
  "checks": [
    {
      "type": "element-exists",
      "status": "pass|fail",
      "message": "Element found/not found",
      "screenshot": "scripts/atlas/results/T042-check-0.png"
    }
  ],
  "errors": [],
  "duration": 1234
}
```

### Result Fields

- **`taskId`** (string): Task ID from spec
- **`specFile`** (string): Path to test spec file
- **`executedAt`** (string, ISO 8601): Timestamp of execution
- **`status`** (string): Overall test status - `"pass"`, `"fail"`, or `"error"`
- **`checks`** (array): Results for each check
  - `type`: Check type
  - `status`: `"pass"` or `"fail"`
  - `message`: Human-readable result message
  - `screenshot`: Optional screenshot path
- **`errors`** (array): Any execution errors
- **`duration`** (number): Test execution time in milliseconds

