# Code Review Assignment - Coding Standards Assignment

## Assignment Description

This assignment involves deliberately creating code that violates coding standards, followed by conducting a comprehensive code review to identify and fix the violations.

## Project Structure

### Branches

1. **`problematic-code`** - Contains the problematic code with 7 intentional violations
2. **`corrected-code`** - Contains the corrected code with all fixes applied

### Main Files

- **`src/pages/AdminStudentManagement.tsx`** - The main file selected for this assignment
- **`code-review-documentation.md`** - Detailed documentation of all violations and fixes
- **`reflection.md`** - Personal reflection on the learning process

## How to Navigate Between Branches

```bash
# Switch to the problematic code branch
git checkout problematic-code

# Switch to the corrected code branch
git checkout corrected-code

# View list of all branches
git branch -a
```

## Standards That Were Violated

1. **Function Naming** - Function names not in camelCase
2. **Responsiveness** - Fixed sizes instead of responsive design
3. **Type Naming** - Type names not in PascalCase
4. **Component Naming** - Component name not in PascalCase
5. **CSS Naming** - CSS class names not in kebab-case
6. **CSS Best Practices** - Using inline styles instead of classes
7. **HTML Best Practices** - Using generic div instead of semantic tags

## Commit History

Each violation and fix was made in a separate commit for precise tracking:

### Problematic Code Branch
- Clean project structure
- VIOLATION #1: Function Naming
- VIOLATION #2: Resposivness  
- VIOLATION #3: Type Naming
- VIOLATION #4: Component Naming
- VIOLATION #5: CSS Naming
- VIOLATION #6: CSS Inline Styles
- VIOLATION #7: HTML Semantic Tags

### Corrected Code Branch
- FIX #1: Function Naming
- FIX #2: Responsivness
- FIX #3: Type Naming  
- FIX #4: Component Naming
- FIX #5: CSS Naming
- FIX #6: CSS Best Practices
- FIX #7: HTML Best Practices

## Running the Project

```bash
# Install dependencies
npm install

# Run the project
npm run dev
```

The project will work in both branches - both the problematic and corrected code are functional and will work properly. 