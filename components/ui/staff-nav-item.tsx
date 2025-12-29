import { createPressable } from '@gluestack-ui/core/pressable/creator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, type ComponentRef } from 'react';
import {
	Pressable,
	Text,
	View,
	type PressableProps,
	type TextProps,
	type ViewProps,
} from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledStaffNavItemRoot = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`bg-white rounded-lg shadow-sm elevation-2 p-4 mb-3 flex-row items-center ${className}`}
		style={style}
		{...props}
	/>
));
StyledStaffNavItemRoot.displayName = 'StyledStaffNavItemRoot';

const StyledStaffNavItemIconContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`w-12 h-12 bg-gray-200 rounded-lg items-center justify-center mr-3 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledStaffNavItemIconContainer.displayName = 'StyledStaffNavItemIconContainer';

const StyledStaffNavItemContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`flex-1 ${className}`} style={style} {...props} />
	),
);
StyledStaffNavItemContent.displayName = 'StyledStaffNavItemContent';

const StyledStaffNavItemTitle = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base font-bold mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledStaffNavItemTitle.displayName = 'StyledStaffNavItemTitle';

const StyledStaffNavItemDescription = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-sm opacity-70 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledStaffNavItemDescription.displayName = 'StyledStaffNavItemDescription';

const StyledStaffNavItemArrowButton = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`w-10 h-10 rounded-full bg-[color:var(--primary)] items-center justify-center ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledStaffNavItemArrowButton.displayName = 'StyledStaffNavItemArrowButton';

const GluestackStaffNavItemRoot = createPressable({
	Root: StyledStaffNavItemRoot,
});

type StaffNavItemProps = PressableProps & {
	iconName: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	onPress?: () => void;
	className?: string;
	iconContainerClassName?: string;
	contentClassName?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	arrowButtonClassName?: string;
};

export function StaffNavItem({
	iconName,
	title,
	description,
	onPress,
	className = '',
	iconContainerClassName = '',
	contentClassName = '',
	titleClassName = '',
	descriptionClassName = '',
	arrowButtonClassName = '',
	...rest
}: StaffNavItemProps) {
	return (
		<GluestackStaffNavItemRoot className={className} onPress={onPress} {...rest}>
			<StyledStaffNavItemIconContainer className={iconContainerClassName}>
				<Ionicons name={iconName} size={24} color='#666666' />
			</StyledStaffNavItemIconContainer>
			<StyledStaffNavItemContent className={contentClassName}>
				<StyledStaffNavItemTitle className={titleClassName}>
					{title}
				</StyledStaffNavItemTitle>
				<StyledStaffNavItemDescription className={descriptionClassName}>
					{description}
				</StyledStaffNavItemDescription>
			</StyledStaffNavItemContent>
			<StyledStaffNavItemArrowButton>
				<Ionicons name='chevron-forward' size={20} color='#FFFFFF' />
			</StyledStaffNavItemArrowButton>
		</GluestackStaffNavItemRoot>
	);
}
