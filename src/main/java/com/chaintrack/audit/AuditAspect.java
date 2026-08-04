package com.chaintrack.audit;

import com.chaintrack.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.expression.Expression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

/**
 * Appends an audit-log entry for every {@link Audited}-annotated controller
 * method. Uses {@code @Around} so a failed invocation is still recorded (with a
 * {@code _FAILED} suffix on the action) before the exception propagates.
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogService auditLogService;
    private final SpelExpressionParser spelParser = new SpelExpressionParser();

    public AuditAspect(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        Object result;
        try {
            result = joinPoint.proceed();
            record(joinPoint, audited, result, false);
            return result;
        } catch (Throwable t) {
            record(joinPoint, audited, null, true);
            throw t;
        }
    }

    private void record(ProceedingJoinPoint joinPoint, Audited audited, Object result, boolean failed) {
        try {
            String actor = currentActor();
            String entityId = resolveEntityId(audited.entityIdExpr(), joinPoint, result);
            String action = failed ? audited.action() + "_FAILED" : audited.action();
            String summary = buildSummary(joinPoint, action);

            auditLogService.record(
                actor,
                action,
                audited.entityType(),
                entityId,
                summary,
                clientIp(),
                requestId()
            );
        } catch (Exception e) {
            // Auditing must never break the business flow
            log.warn("Audit record failed for {}: {}", audited.action(), e.getMessage());
        }
    }

    private String currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }

    private String resolveEntityId(String expr, ProceedingJoinPoint joinPoint, Object result) {
        if (expr == null || expr.isBlank()) {
            return null;
        }
        try {
            Expression expression = spelParser.parseExpression(expr);
            StandardEvaluationContext ctx = new StandardEvaluationContext();
            ctx.setVariable("result", result);
            Object[] args = joinPoint.getArgs();
            for (int i = 0; i < args.length; i++) {
                ctx.setVariable("arg" + i, args[i]);
            }
            Object value = expression.getValue(ctx);
            return value == null ? null : String.valueOf(value);
        } catch (Exception e) {
            log.debug("Could not resolve audit entity id expr '{}': {}", expr, e.getMessage());
            return null;
        }
    }

    private String buildSummary(ProceedingJoinPoint joinPoint, String action) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String className = method.getDeclaringClass().getSimpleName();
        Object[] args = joinPoint.getArgs();
        StringBuilder sb = new StringBuilder(className).append(".").append(method.getName()).append("(");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            Object arg = args[i];
            if (arg == null) {
                sb.append("null");
            } else if (arg instanceof HttpServletRequest) {
                sb.append("request");
            } else {
                String s = arg.toString();
                sb.append(s.length() > 200 ? s.substring(0, 200) + "…" : s);
            }
        }
        sb.append(") → ").append(action);
        return sb.toString();
    }

    private String clientIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        HttpServletRequest request = attrs.getRequest();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String requestId() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        String id = attrs.getRequest().getHeader("X-Request-Id");
        return id == null || id.isBlank() ? null : id;
    }
}
