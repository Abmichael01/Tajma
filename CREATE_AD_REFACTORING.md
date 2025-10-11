# Create Ad Component Refactoring
**Status:** In Progress
**Goal:** Break down 974-line CreateAdClient.tsx into modular components

---

## ✅ COMPLETED COMPONENTS

### 1. **ProgressStepper.tsx** (75 lines)
**Path:** `/components/create-ad/ProgressStepper.tsx`
**Purpose:** Timeline with steps indicator
**Props:**
- `currentStep: number`
- `steps: Step[]`

### 2. **AdTypeIndicator.tsx** (25 lines)
**Path:** `/components/create-ad/AdTypeIndicator.tsx`
**Purpose:** Badge showing product/service/cv type
**Props:**
- `adType: 'product' | 'service' | 'cv'`

### 3. **BasicInfoStep.tsx** (145 lines)
**Path:** `/components/create-ad/BasicInfoStep.tsx`
**Purpose:** Step 1 - Category, title, location
**Props:**
- `formData`
- `errors`
- `subcategoryOptions`
- `selectedCategory`
- `onInputChange`

---

## 🔄 REMAINING COMPONENTS TO CREATE

### 4. **DetailsStep.tsx** (~300 lines)
**Purpose:** Step 2 - Description, pricing, custom fields, CV upload
**Will Include:**
- Description textarea
- Price/CV upload based on ad type
- Dynamic custom fields (condition, brand, year, etc.)
- Contact information

### 5. **ReviewStep.tsx** (~150 lines)
**Purpose:** Step 3 - Image upload, review summary
**Will Include:**
- Image upload and preview
- Remove images
- Review summary card
- Safety tips

### 6. **DynamicFormFields.tsx** (~200 lines)
**Purpose:** Reusable component for category-specific fields
**Will Render:**
- Vehicle fields (year, mileage, transmission)
- Property fields (bedrooms, bathrooms, furnishing)
- Electronics fields (brand, model, condition)
- Job/CV fields (experience, education, skills)

---

## 📊 SIZE COMPARISON

**Before:**
```
CreateAdClient.tsx: 974 lines
```

**After Refactoring:**
```
CreateAdClient.tsx: ~150 lines (main orchestrator)
ProgressStepper.tsx: 75 lines
AdTypeIndicator.tsx: 25 lines
BasicInfoStep.tsx: 145 lines
DetailsStep.tsx: 300 lines
ReviewStep.tsx: 150 lines
DynamicFormFields.tsx: 200 lines
```

**Total Lines:** ~1045 lines (organized into 7 manageable files)

---

## 🎯 BENEFITS

1. ✅ **Maintainability** - Each component has single responsibility
2. ✅ **Reusability** - Components can be used elsewhere
3. ✅ **Testability** - Easier to unit test small components
4. ✅ **Readability** - Clear file names, easier to navigate
5. ✅ **Performance** - Can optimize individual components
6. ✅ **Collaboration** - Multiple devs can work on different files

---

## 📁 NEW STRUCTURE

```
/components/create-ad/
├── ProgressStepper.tsx      ✅ Created
├── AdTypeIndicator.tsx      ✅ Created
├── BasicInfoStep.tsx        ✅ Created
├── DetailsStep.tsx          🔄 Next
├── ReviewStep.tsx           🔄 Next
├── DynamicFormFields.tsx    🔄 Next
└── index.ts                 🔄 Barrel exports

/app/create-ad/
└── CreateAdClient.tsx       🔄 Refactor to use components
```

---

## 🚀 NEXT STEPS

1. Create DetailsStep.tsx
2. Create ReviewStep.tsx
3. Create DynamicFormFields.tsx
4. Refactor CreateAdClient.tsx to import and use all components
5. Test the entire flow
6. Verify no functionality is lost

---

**Estimated Time:** 30 minutes
**Status:** 50% Complete (3/6 components done)

