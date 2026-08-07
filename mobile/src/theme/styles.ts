import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS } from './colors';

const { width, height } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary
  },
  container: {
    flex: 1,
    padding: SPACING.space4,
    backgroundColor: COLORS.bgPrimary
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.space4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.space4
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.space2
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.space2
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20
  },
  input: {
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.space3,
    color: COLORS.textPrimary,
    fontSize: 14
  },
  button: {
    backgroundColor: COLORS.blue,
    paddingVertical: SPACING.space3,
    paddingHorizontal: SPACING.space4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: COLORS.bgTertiary,
    paddingVertical: SPACING.space3,
    paddingHorizontal: SPACING.space4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  dangerButton: {
    backgroundColor: COLORS.red,
    paddingVertical: SPACING.space3,
    paddingHorizontal: SPACING.space4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '600'
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14
  }
});
