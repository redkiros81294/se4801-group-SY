package com.chaintrack.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method as audited. After the method returns successfully,
 * an audit-log entry is appended with the authenticated actor, the action, the
 * target entity type, and (optionally) the affected entity id.
 *
 * <p>{@code entityIdExpr} is a SpEL expression evaluated with the method's
 * return value available as {@code #result} and the method arguments as
 * {@code #arg0}, {@code #arg1}, ... — e.g. {@code "#result.id()"} for a DTO
 * record, or {@code "#arg0"} for a path variable.</p>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** High-level action, e.g. CREATE, UPDATE, DELETE, LOGIN, APPROVE. */
    String action();

    /** Entity type, e.g. USER, PRODUCT, BATCH, MOVEMENT, ORGANIZATION. */
    String entityType();

    /** SpEL expression resolving the affected entity id. Defaults to empty. */
    String entityIdExpr() default "";
}
