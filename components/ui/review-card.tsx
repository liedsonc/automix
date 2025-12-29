import { createImage } from '@gluestack-ui/core/image/creator';
import { createPressable } from '@gluestack-ui/core/pressable/creator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, type ComponentRef } from 'react';
import {
	Image,
	Pressable,
	Text,
	View,
	type ImageProps,
	type PressableProps,
	type TextProps,
	type ViewProps,
} from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledReviewCardRoot = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`bg-white rounded-lg p-3 mb-3 flex-row ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledReviewCardRoot.displayName = 'StyledReviewCardRoot';

const StyledReviewCardAvatar = forwardRef<ComponentRef<typeof Image>, WithClassName<ImageProps>>(
	({ className = '', style, ...props }, ref) => (
		<Image
			ref={ref}
			className={`w-12 h-12 rounded-full mr-3 ${className}`}
			style={style}
			resizeMode='cover'
			{...props}
		/>
	),
);
StyledReviewCardAvatar.displayName = 'StyledReviewCardAvatar';

const StyledReviewCardContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`flex-1 ${className}`} style={style} {...props} />
	),
);
StyledReviewCardContent.displayName = 'StyledReviewCardContent';

const StyledReviewCardName = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base font-bold mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledReviewCardName.displayName = 'StyledReviewCardName';

const StyledReviewCardStarsContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`flex-row mb-2 ${className}`} style={style} {...props} />
	),
);
StyledReviewCardStarsContainer.displayName = 'StyledReviewCardStarsContainer';

const StyledReviewCardText = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-sm ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledReviewCardText.displayName = 'StyledReviewCardText';

const GluestackReviewCardAvatar = createImage({
	Root: StyledReviewCardAvatar,
});

type ReviewCardProps = {
	avatarSource: ImageProps['source'];
	userName: string;
	rating: number;
	comment: string;
	className?: string;
	avatarClassName?: string;
	contentClassName?: string;
	nameClassName?: string;
	starsClassName?: string;
	textClassName?: string;
};

export function ReviewCard({
	avatarSource,
	userName,
	rating,
	comment,
	className = '',
	avatarClassName = '',
	contentClassName = '',
	nameClassName = '',
	starsClassName = '',
	textClassName = '',
}: ReviewCardProps) {
	const stars = Array.from({ length: 5 }, (_, index) => index < rating);

	return (
		<StyledReviewCardRoot className={className}>
			<GluestackReviewCardAvatar source={avatarSource} className={avatarClassName} />
			<StyledReviewCardContent className={contentClassName}>
				<StyledReviewCardName className={nameClassName}>{userName}</StyledReviewCardName>
				<StyledReviewCardStarsContainer className={starsClassName}>
					{stars.map((filled, index) => (
						<Ionicons
							key={index}
							name={filled ? 'star' : 'star-outline'}
							size={16}
							color={filled ? '#FFD700' : '#CCCCCC'}
						/>
					))}
				</StyledReviewCardStarsContainer>
				<StyledReviewCardText className={textClassName}>{comment}</StyledReviewCardText>
			</StyledReviewCardContent>
		</StyledReviewCardRoot>
	);
}
