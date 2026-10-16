---
section: Internal
---

`ExerciseDetailPage` and `ProgramPlanningPage` are split under 100 lines per function, with two unexported siblings (`ExerciseDetailSectionCard`, `ProgramPlanningBreadcrumbs`). `ProgramNavLevel` and `ProgramBreadcrumb` are now declared in the breadcrumb sibling and re-exported unchanged from `@titan-design/react-ui/pages`. No rendered, prop or className change (TD-215).
