export type TaskSortKey = 'slug' | 'id' | 'title' | 'severity' | 'priority' | 'estimate' | 'updated'

/** Any column the table can leave out; `title` is the one column that always renders. */
export type TaskColumnKey = Exclude<TaskSortKey, 'title'> | 'tags'
