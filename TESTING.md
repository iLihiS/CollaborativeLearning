# Unit Tests Guide

This document explains how to run and use the existing unit tests for the collaborative learning system.

## 📋 Overview

Comprehensive unit tests exist for:
- **Student Entity** - CRUD tests (Create, Read, Update, Delete)
- **Validation Logic** - Tests for all validation functions
- **Student Management Form** - UI and form tests
- **Student Table** - Sorting, filtering, and search tests

## 🛠 Installing Dependencies

Before running tests, install the required packages:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/ui jsdom
```

## 🚀 Running Tests

### Basic Run
```bash
npm run test
```

### Run with UI Interface
```bash
npm run test:ui
```

### One-time Run
```bash
npm run test:run
```

### Watch Mode
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Tests
```bash
# Validation tests only
npm run test validation

# Entity tests only
npm run test entities

# AdminStudentManagement tests only
npm run test AdminStudentManagement

# Table tests only
npm run test table

# Specific test file
npm run test src/api/__tests__/entities.test.ts
```

## 📁 Test File Structure

```
src/
├── api/
│   └── __tests__/
│       └── entities.test.ts              # Student entity tests
├── pages/
│   └── __tests__/
│       ├── AdminStudentManagement.test.tsx      # Form tests
│       └── AdminStudentManagement.table.test.tsx # Table tests
├── utils/
│   └── __tests__/
│       └── validation.test.ts           # Validation tests
└── test/
    ├── setup.ts                         # Test setup
    └── mocks.ts                         # Mock data
```

## 🧪 Types of Tests

### 1. Student Entity Tests
Location: `src/api/__tests__/entities.test.ts`

These tests ensure that:
- ✅ CRUD operations work properly
- ✅ Error handling is performed correctly
- ✅ Filtering and search function
- ✅ Data validation works

Example test:
```typescript
it('should create a new student', async () => {
  const newStudentData = {
    full_name: 'Danny Cohen',
    student_id: 'CS123',
    email: 'danny@example.com',
    academic_track_ids: ['track1']
  }
  
  const result = await Student.create(newStudentData)
  expect(result).toEqual(expect.objectContaining(newStudentData))
})
```

### 2. Validation Tests
Location: `src/utils/__tests__/validation.test.ts`

These tests ensure that:
- ✅ Hebrew names are validated correctly
- ✅ Israeli ID numbers are validated
- ✅ Email addresses are validated
- ✅ Student and employee IDs are validated
- ✅ File uploads are validated

Example test:
```typescript
it('should validate Hebrew names correctly', () => {
  expect(Validators.validateHebrewName('יהונתן כהן').isValid).toBe(true)
  expect(Validators.validateHebrewName('John Smith').isValid).toBe(false)
})
```

### 3. Student Management Form Tests
Location: `src/pages/__tests__/AdminStudentManagement.test.tsx`

These tests ensure that:
- ✅ The form loads properly
- ✅ Real-time validation works
- ✅ Save and update operations work
- ✅ Error handling functions

Example test:
```typescript
it('should show validation errors for empty fields', async () => {
  render(<AdminStudentManagement />)
  
  await user.click(screen.getByText('Add New Student'))
  await user.click(screen.getByText('Save'))
  
  expect(screen.getByText('Full name is required')).toBeInTheDocument()
})
```

### 4. Student Table Tests
Location: `src/pages/__tests__/AdminStudentManagement.table.test.tsx`

These tests ensure that:
- ✅ The table displays data correctly
- ✅ Sorting works on all columns
- ✅ Filtering and search work
- ✅ Action buttons function
- ✅ Accessibility is ensured

Example test:
```typescript
it('should sort students by name when header clicked', async () => {
  render(<AdminStudentManagement />)
  
  const nameHeader = screen.getByText('Full Name')
  await user.click(nameHeader)
  
  // Check sorting...
})
```

## 🎯 Coverage Targets

The tests cover:
- **Functions**: 90%+ function coverage
- **Lines**: 85%+ line coverage
- **Branches**: 80%+ branch coverage
- **Statements**: 85%+ statement coverage

## 🔧 Advanced Settings

### Running Specific Tests
```bash
# Run validation tests only
npm run test validation

# Run table tests only
npm run test table

# Run entity tests only
npm run test entities
```

### Debug Mode
```bash
npm run test -- --reporter=verbose
```

### Run with Coverage Threshold
```bash
npm run test:coverage -- --coverage.threshold.lines=85
```

## 🐛 Common Troubleshooting

### Import Issues
If you encounter import errors, ensure:
```typescript
// In vite.config.ts file
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### TypeScript Issues
If you have TypeScript errors:
```bash
npm install --save-dev @types/jest
```

### DOM Issues
If you have DOM errors, ensure jsdom is installed:
```json
// In vitest.config.ts file
test: {
  environment: 'jsdom'
}
```

## 📝 Adding New Tests

### Basic Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Async Tests
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction()
  expect(result).toBe('expected value')
})
```

### Event Tests
```typescript
it('should handle click events', async () => {
  const user = userEvent.setup()
  render(<Button onClick={mockFn} />)
  
  await user.click(screen.getByRole('button'))
  expect(mockFn).toHaveBeenCalled()
})
```

## 🚀 CI/CD Integration

For CI/CD integration, add to your script:
```bash
# In .github/workflows/test.yml file
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

## 📊 Reports and Monitoring

The tests generate detailed reports in:
- Console output - immediate results
- HTML reports - detailed coverage report
- JSON reports - for automated processing

## 🎉 Summary

The testing system provides:
- ✅ Comprehensive Student entity coverage
- ✅ Comprehensive validation tests
- ✅ Detailed UI tests
- ✅ Easy maintenance and extension
- ✅ Detailed reports

To run all tests simply execute:
```bash
npm run test
```

To view coverage report:
```bash
npm run test:coverage
```
